// src/components/reservation/ReservationForm.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Badge, Card, ListGroup } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { ClassroomFake } from '../../types/classroom';
import type { Reservation } from '../../types/building';
import { 
  checkTimeConflict, 
  addReservation,
  getAllReservations
} from '../../utils/reservationDB';
import { eventBus } from '../../utils/eventBus';

interface ReservationFormProps {
  show: boolean;
  onHide: () => void;
  classroom: ClassroomFake | null;
  onReservationSuccess: (reservation: Reservation) => void;
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
}

// DatePicker 스타일
const datePickerStyle = {
  width: '100%',
  padding: '0.375rem 0.75rem',
  fontSize: '1rem',
  fontWeight: 400,
  lineHeight: 1.5,
  color: '#212529',
  backgroundColor: '#fff',
  backgroundImage: 'none',
  border: '1px solid #ced4da',
  borderRadius: '0.375rem',
  transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
};

const ReservationForm: React.FC<ReservationFormProps> = ({
  show,
  onHide,
  classroom,
  onReservationSuccess,
  defaultDate,
  defaultStartTime,
  defaultEndTime
}) => {
  const [formData, setFormData] = useState({
    roomId: '',
    date: '',
    time: '',
    duration: 1,
    guestName: '',
    purpose: ''
  });
  
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [alertVariant, setAlertVariant] = useState<'success' | 'danger' | 'warning'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReservations, setExistingReservations] = useState<Reservation[]>([]);
  const [realTimeWarnings, setRealTimeWarnings] = useState<string[]>([]);
  const [showConflictDetails, setShowConflictDetails] = useState(false);

  useEffect(() => {
    if (classroom) {
      setFormData(prev => ({
        ...prev,
        roomId: classroom.roomId // classroom.roomId를 직접 사용
      }));
    }
  
    if (show && defaultDate) {
      const duration = defaultStartTime && defaultEndTime ? 
        calculateDuration(defaultStartTime, defaultEndTime) : 1;
        
      setFormData(prev => ({
        ...prev,
        date: defaultDate,
        time: defaultStartTime || '',
        duration: duration
      }));
    }
  }, [classroom, show, defaultDate, defaultStartTime, defaultEndTime]);

  // 시간 차이 계산 (시간 단위)
  const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return Math.max(1, Math.round((endMinutes - startMinutes) / 60));
  };

  // 해당 날짜의 기존 예약 로드
  useEffect(() => {
    if (formData.roomId && formData.date) {
      loadExistingReservations();
    }
  }, [formData.roomId, formData.date]);

  const loadExistingReservations = async () => {
    try {
      const allReservations = await getAllReservations();
      const roomReservations = allReservations.filter(res => 
        res.roomId === formData.roomId && res.date === formData.date
      );
      setExistingReservations(roomReservations);
    } catch (error) {
      console.error('기존 예약 로드 실패:', error);
    }
  };

  // 실시간 중복 검사
  useEffect(() => {
    if (formData.roomId && formData.date && formData.time && formData.duration) {
      checkRealTimeConflict();
    } else {
      setRealTimeWarnings([]);
      setShowConflictDetails(false);
    }
  }, [formData.roomId, formData.date, formData.time, formData.duration]);

  const checkRealTimeConflict = async () => {
    try {
      const conflictResult = await checkTimeConflict(
        formData.roomId, 
        formData.date, 
        formData.time, 
        formData.duration
      );
  
      if (conflictResult.hasConflict) {
        const warnings = conflictResult.conflictingReservations.map(res => 
          `${res.time}-${addHours(res.time, res.duration)} (${res.guestName}: ${res.purpose})`
        );
        setRealTimeWarnings(warnings);
        setShowConflictDetails(true);
      } else {
        setRealTimeWarnings([]);
        setShowConflictDetails(false);
      }
    } catch (error) {
      console.error('실시간 충돌 검사 실패:', error);
      setRealTimeWarnings([]);
      setShowConflictDetails(false);
    }
  };

  // 시간에 시간을 더하는 함수
  const addHours = (time: string, hours: number): string => {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + (hours * 60);
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setAlertMessage('');
  };

  const validateForm = (): boolean => {
    if (!formData.date || !formData.time || !formData.guestName || !formData.purpose) {
      setAlertMessage('모든 필드를 입력해주세요.');
      setAlertVariant('danger');
      return false;
    }

    // 과거 날짜인지 확인
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setAlertMessage('과거 날짜는 선택할 수 없습니다.');
      setAlertVariant('danger');
      return false;
    }

    // 실시간 경고가 있는지 확인
    if (realTimeWarnings.length > 0) {
      setAlertMessage('시간 중복 문제를 해결한 후 다시 시도해주세요.');
      setAlertVariant('danger');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setAlertMessage('');

    try {
      // 최종 시간 중복 확인
      const conflictResult = await checkTimeConflict(
        formData.roomId, 
        formData.date, 
        formData.time, 
        formData.duration
      );
      
      if (conflictResult.hasConflict) {
        alert('선택하신 시간대에 이미 예약이 있습니다. 다른 시간을 선택해주세요.')
        setAlertMessage('선택하신 시간대에 이미 예약이 있습니다. 다른 시간을 선택해주세요.');
        setAlertVariant('danger');
        console.log('danger')
        return;
      }

      // 새 예약 생성
      const newReservation: Reservation = {
        id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId: formData.roomId,
        date: formData.date,
        time: formData.time,
        duration: formData.duration,
        guestName: formData.guestName,
        purpose: formData.purpose,
        createdAt: new Date().toISOString()
      };

      // DB에 저장
      await addReservation(newReservation);
      
      setAlertMessage('✅ 예약이 성공적으로 완료되었습니다!');
      setAlertVariant('success');
      alert('✅ 예약이 성공적으로 완료되었습니다!')
      console.log('success')
      // 예약 성공 콜백 호출
      onReservationSuccess(newReservation);

      // EventBus를 통해 전역 업데이트 이벤트 발생
      eventBus.emit('reservationUpdated');
      
      // 폼 초기화는 모달이 닫힌 후에 처리
      setTimeout(() => {
        setFormData({
          roomId: classroom?.roomId || '', // classroom.roomId 사용
          date: '',
          time: '',
          duration: 1,
          guestName: '',
          purpose: ''
        });
        setAlertMessage('');
        setRealTimeWarnings([]);
        setShowConflictDetails(false);
      }, 100);
    } catch (error) {
      setAlertMessage('예약 처리 중 오류가 발생했습니다.');
      setAlertVariant('danger');
      console.error('Reservation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      roomId: classroom?.roomId || '', // classroom.roomId 사용
      date: '',
      time: '',
      duration: 1,
      guestName: '',
      purpose: ''
    });
    setAlertMessage('');
    setRealTimeWarnings([]);
    setShowConflictDetails(false);
    onHide();
  };

  const getTimeInputClassName = () => {
    if (realTimeWarnings.length > 0) {
      return 'form-control is-invalid';
    }
    if (formData.time && realTimeWarnings.length === 0) {
      return 'form-control is-valid';
    }
    return 'form-control';
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static">
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="bi bi-calendar-plus me-2"></i>
          강의실 예약 - {classroom?.name} ({classroom?.building})
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {alertMessage && (
          <Alert variant={alertVariant} className="mb-3">
            <i className={`bi bi-${
              alertVariant === 'success' ? 'check-circle' : 
              alertVariant === 'warning' ? 'exclamation-triangle' : 
              'exclamation-triangle'
            } me-2`}></i>
            <div style={{ whiteSpace: 'pre-line' }}>{alertMessage}</div>
          </Alert>
        )}

        {/* 실시간 시간 중복 경고 */}
        {showConflictDetails && realTimeWarnings.length > 0 && (
          <Alert variant="danger" className="mb-3">
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <strong>시간 중복 경고</strong>
            </div>
            <ListGroup variant="flush">
              {realTimeWarnings.map((warning, index) => (
                <ListGroup.Item key={index} className="border-0 px-0 py-1">
                  <i className="bi bi-dot me-1"></i>
                  {warning}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>
                  <i className="bi bi-calendar-date me-2"></i>
                  예약 날짜
                </Form.Label>
                <DatePicker
                  selected={formData.date ? new Date(formData.date) : null}
                  onChange={(date) => {
                    if (date && date instanceof Date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      setFormData(prev => ({
                        ...prev,
                        date: `${year}-${month}-${day}`
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        date: ''
                      }));
                    }
                    setAlertMessage('');
                  }}
                  dateFormat="yyyy년 MM월 dd일"
                  placeholderText="예약 날짜를 선택해주세요"
                  className="form-control"
                  minDate={new Date()}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-3">
              <Form.Group className="mb-3">
                <Form.Label>
                  <i className="bi bi-clock me-2"></i>
                  시작 시간
                </Form.Label>
                <DatePicker
                  selected={formData.time ? new Date(`2000-01-01T${formData.time}:00`) : null}
                  onChange={(date) => {
                    if (date && date instanceof Date) {
                      const hours = date.getHours().toString().padStart(2, '0');
                      const minutes = date.getMinutes().toString().padStart(2, '0');
                      setFormData(prev => ({
                        ...prev,
                        time: `${hours}:${minutes}`
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        time: ''
                      }));
                    }
                    setAlertMessage('');
                  }}
                  showTimeSelect
                  showTimeSelectOnly
                  timeFormat="HH:mm"
                  dateFormat="HH:mm"
                  timeIntervals={30}
                  timeCaption="시간"
                  placeholderText="시작 시간 선택"
                  className={getTimeInputClassName()}
                  minTime={new Date(`2000-01-01T09:00:00`)}
                  maxTime={new Date(`2000-01-01T20:30:00`)}
                  required
                />
              </Form.Group>
            </div>
            <div className="col-md-3">
              <Form.Group className="mb-3">
                <Form.Label>
                  <i className="bi bi-hourglass me-2"></i>
                  사용 시간
                </Form.Label>
                <Form.Select
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    duration: parseInt(e.target.value)
                  }))}
                  required
                >
                  <option value={1}>1시간</option>
                  <option value={2}>2시간</option>
                  <option value={3}>3시간</option>
                  <option value={4}>4시간</option>
                  <option value={5}>5시간</option>
                  <option value={6}>6시간</option>
                  <option value={7}>7시간</option>
                  <option value={8}>8시간</option>
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3">
            <Form.Label>
              <i className="bi bi-person me-2"></i>
              예약자 이름
            </Form.Label>
            <Form.Control
              type="text"
              name="guestName"
              value={formData.guestName}
              onChange={handleInputChange}
              placeholder="예: 김교수, 홍길동 등"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              <i className="bi bi-clipboard me-2"></i>
              사용 목적
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              placeholder="회의실 사용 목적을 입력하세요"
              required
            />
          </Form.Group>

          {/* 기존 예약 현황 표시 */}
          {existingReservations.length > 0 && formData.date && (
            <Card className="mb-3">
              <Card.Header className="bg-light">
                <h6 className="mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  {formData.date} 기존 예약 현황
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex flex-wrap gap-2">
                  {existingReservations.map(reservation => (
                    <Badge 
                      key={reservation.id} 
                      bg="secondary" 
                      className="p-2 fs-6"
                    >
                      <i className="bi bi-clock me-1"></i>
                      {reservation.time}-{addHours(reservation.time, reservation.duration)}
                      <br />
                      <small>{reservation.purpose} ({reservation.guestName})</small>
                    </Badge>
                  ))}
                </div>
                {existingReservations.length === 0 && (
                  <div className="text-muted">
                    <i className="bi bi-check-circle me-2"></i>
                    선택한 날짜에 예약이 없습니다.
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* 예약 가능 시간 안내 */}
          <Card className="mb-3 border-info">
            <Card.Header className="bg-info bg-opacity-10">
              <h6 className="mb-0 text-info">
                <i className="bi bi-lightbulb me-2"></i>
                예약 안내사항
              </h6>
            </Card.Header>
            <Card.Body>
              <ul className="mb-0 small">
                <li>예약은 최소 30분 단위로 가능합니다.</li>
                <li>기존 예약 시간과 1분이라도 겹치면 예약할 수 없습니다.</li>
                <li>예약 후 변경이나 취소는 예약 목록에서 가능합니다.</li>
                <li>강의실 사용 시간은 09:00 ~ 21:00입니다.</li>
              </ul>
            </Card.Body>
          </Card>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose}>
          <i className="bi bi-x-lg me-2"></i>
          취소
        </Button>
        <Button 
          variant={realTimeWarnings.length > 0 ? "outline-danger" : "primary"}
          onClick={handleSubmit}
          disabled={isSubmitting || realTimeWarnings.length > 0}
        >
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              처리중...
            </>
          ) : realTimeWarnings.length > 0 ? (
            <>
              <i className="bi bi-exclamation-triangle me-2"></i>
              시간 중복
            </>
          ) : (
            <>
              <i className="bi bi-check-lg me-2"></i>
              예약하기
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReservationForm;