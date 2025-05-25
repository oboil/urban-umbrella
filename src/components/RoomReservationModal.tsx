import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, ListGroup, Badge, Card, Alert, Spinner, Tab, Tabs } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { Room } from '../types/building';
import type { AuthSession } from '../types/auth';
import type { Lecture } from '../types/Lecture';
import { deleteReservation, checkTimeConflict } from '../utils/reservationDB';
import { getCurrentSession, authenticatePasskey } from '../utils/passkeyAuth';
import { getLecturesByRoom } from '../utils/lectureDB';

interface RoomReservationModalProps {
  show: boolean;
  onHide: () => void;
  room: Room | null;
  onReservation: (roomId: string, date: string, time: string, guestName: string, purpose: string, duration?: number) => void;
}

const RoomReservationModal: React.FC<RoomReservationModalProps> = ({
  show,
  onHide,
  room,
  onReservation
}) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [deletingReservationId, setDeletingReservationId] = useState<string | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);

  // 중복 체크 관련 상태
  const [conflictAlert, setConflictAlert] = useState<{
    show: boolean;
    type: 'warning' | 'danger';
    message: string;
    conflictingReservations?: any[];
  }>({
    show: false,
    type: 'warning',
    message: '',
    conflictingReservations: []
  });

  // Passkey 관련 상태
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [activeTab, setActiveTab] = useState<string>('passkey');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // 인증 세션 확인
  useEffect(() => {
    if (show) {
      const session = getCurrentSession();
      setAuthSession(session);
    }
  }, [show]);

  // 강의 정보 가져오기
  useEffect(() => {
    const fetchLectures = async () => {
      if (show && room) {
        try {
          const roomLectures = await getLecturesByRoom(room.id);
          setLectures(roomLectures);
        } catch (error) {
          console.error('강의 정보를 가져오는데 실패했습니다:', error);
        }
      }
    };
    fetchLectures();
  }, [show, room]);

  // 강의 스케줄을 예약 형태로 변환하는 함수
  const convertLectureToScheduleItems = (lecture: Lecture) => {
    const days = lecture.week.split(' ');
    const times = lecture.time.split(' ');
    const durations = lecture.duration.split(' ');

    const scheduleItems: any[] = [];
    const today = new Date();

    // 다음 7일간의 강의 스케줄 생성
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];

      days.forEach((day, index) => {
        if (day.toLowerCase() === dayName.toLowerCase()) {
          const time = times[index] || times[0];
          const duration = parseFloat(durations[index] || durations[0]);

          scheduleItems.push({
            id: `lecture-${lecture.id}-${date.toISOString().split('T')[0]}-${index}`,
            type: 'lecture',
            guestName: lecture.name,
            purpose: '정규 강의',
            date: date.toISOString().split('T')[0],
            time: time,
            duration: duration,
            building: lecture.building
          });
        }
      });
    }

    return scheduleItems;
  };

  // Passkey 인증 함수
  const handlePasskeyAuth = async () => {
    setIsAuthenticating(true);
    try {
      const session = await authenticatePasskey();
      setAuthSession(session);
      alert(`${session.displayName}님으로 인증되었습니다!`);
    } catch (error) {
      console.error('Passkey 인증 오류:', error);
      alert(error instanceof Error ? error.message : 'Passkey 인증에 실패했습니다.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !date || !time) return;

    // 중복 체크 경고 초기화
    setConflictAlert({ show: false, type: 'warning', message: '', conflictingReservations: [] });

    let finalGuestName = guestName;
    let finalPurpose = purpose;

    // Passkey 인증이 되어 있다면 해당 정보 사용
    if (authSession && activeTab === 'passkey') {
      finalGuestName = authSession.displayName;
      finalPurpose = purpose || '회의실 이용';
    }

    if (!finalGuestName || !finalPurpose) return;

    try {
      // 시간 중복 체크
      const conflictResult = await checkTimeConflict(room.id, date, time, duration);

      if (conflictResult.hasConflict) {
        // 충돌하는 예약이 있는 경우
        setConflictAlert({
          show: true,
          type: 'danger',
          message: `선택하신 시간대에 이미 예약이 있습니다. 다른 시간을 선택해주세요.`,
          conflictingReservations: conflictResult.conflictingReservations
        });
        return;
      }

      // 중복이 없으면 예약 진행
      onReservation(room.id, date, time, finalGuestName, finalPurpose, duration);

      // 폼 초기화
      setDate('');
      setTime('');
      setDuration(1);
      setGuestName('');
      setPurpose('');
      setConflictAlert({ show: false, type: 'warning', message: '', conflictingReservations: [] });

    } catch (error) {
      console.error('예약 중복 체크 오류:', error);
      setConflictAlert({
        show: true,
        type: 'warning',
        message: '예약 확인 중 오류가 발생했습니다. 다시 시도해주세요.',
        conflictingReservations: []
      });
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    if (!confirm('정말로 이 예약을 삭제하시겠습니까?')) {
      return;
    }

    setDeletingReservationId(reservationId);
    try {
      await deleteReservation(reservationId);
      alert('예약이 삭제되었습니다.');
      onHide();
    } catch (error) {
      console.error('Failed to delete reservation:', error);
      alert('예약 삭제에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setDeletingReservationId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    return `${hours}시 ${minutes}분`;
  };

  const isReservationPast = (date: string, time: string) => {
    const reservationDateTime = new Date(`${date}T${time}`);
    return reservationDateTime < new Date();
  };

  if (!room) return null;

  const existingReservations = room.reservations || [];

  // 강의 스케줄을 예약 형태로 변환
  const lectureSchedules = lectures.flatMap(lecture => convertLectureToScheduleItems(lecture));

  // 예약에 타입 추가
  const reservationsWithType = existingReservations.map(reservation => ({
    ...reservation,
    type: 'reservation'
  }));

  // 예약과 강의를 합쳐서 날짜순으로 정렬
  const allScheduleItems = [...reservationsWithType, ...lectureSchedules]
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-door-open me-2"></i>
            {room.name} ({room.id}호) 예약 관리
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            {/* 기존 예약 목록 */}
            <Col lg={5}>
              <Card className="h-100">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">
                    <i className="bi bi-calendar-check me-2"></i>
                    현재 예약 목록
                    <Badge bg="info" className="ms-2">{allScheduleItems.length}건</Badge>
                  </h5>
                </Card.Header>
                <Card.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {allScheduleItems.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-calendar-x" style={{ fontSize: '2rem' }}></i>
                      <p className="mt-2 mb-0">예약이 없습니다.</p>
                    </div>
                  ) : (
                    <ListGroup variant="flush">
                      {allScheduleItems.map((item) => {
                        const isPast = isReservationPast(item.date, item.time);
                        const isLecture = item.type === 'lecture';
                        return (
                          <ListGroup.Item key={item.id} className={`px-0 ${isPast ? 'opacity-50' : ''}`}>
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center mb-2">
                                  <h6 className="mb-0 me-2">{item.guestName}</h6>
                                  {isLecture ? (
                                    <Badge bg="warning" text="dark">강의</Badge>
                                  ) : isPast ? (
                                    <Badge bg="secondary">완료</Badge>
                                  ) : (
                                    <Badge bg="success">예약중</Badge>
                                  )}
                                </div>
                                <p className="mb-1 text-muted small">{item.purpose}</p>
                                <div className="d-flex align-items-center">
                                  <small className="text-muted me-3">
                                    <i className="bi bi-calendar3 me-1"></i>
                                    {formatDate(item.date)}
                                  </small>
                                  <small className="text-muted me-3">
                                    <i className="bi bi-clock me-1"></i>
                                    {formatTime(item.time)}
                                  </small>
                                  <Badge bg="secondary" className="me-2">
                                    {item.duration}시간
                                  </Badge>
                                  {isLecture && item.building && (
                                    <Badge bg="outline-warning" className="me-2">
                                      <i className="bi bi-building me-1"></i>
                                      {item.building}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="ms-2">
                                {!isLecture && (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    disabled={deletingReservationId === item.id}
                                    onClick={() => handleDeleteReservation(item.id)}
                                    title="예약 삭제"
                                  >
                                    {deletingReservationId === item.id ? (
                                      <span className="spinner-border spinner-border-sm" role="status"></span>
                                    ) : (
                                      <i className="bi bi-trash"></i>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </ListGroup.Item>
                        );
                      })}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* 새 예약 폼 */}
            <Col lg={7}>
              <Card className="h-100">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-plus-circle me-2"></i>
                    새 예약 추가
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k || 'passkey')}
                    className="mb-3"
                  >
                    {/* Passkey 인증 탭 */}
                    <Tab eventKey="passkey" title={
                      <span>
                        <i className="bi bi-shield-check me-1"></i>
                        Passkey로 예약
                      </span>
                    }>
                      {authSession ? (
                        <div>
                          <Alert variant="success" className="d-flex align-items-center">
                            <i className="bi bi-shield-check me-2"></i>
                            <div>
                              <strong>{authSession.displayName}</strong>님으로 로그인됨<br />
                              <small className="text-muted">아래 정보를 입력하여 예약하세요</small>
                            </div>
                          </Alert>

                          <Form onSubmit={handleSubmit}>
                            {/* 충돌 경고 메시지 */}
                            {conflictAlert.show && (
                              <Alert variant={conflictAlert.type} className="mb-3">
                                <Alert.Heading>
                                  <i className="bi bi-exclamation-triangle me-2"></i>
                                  예약 시간 충돌
                                </Alert.Heading>
                                <p className="mb-2">{conflictAlert.message}</p>
                                {conflictAlert.conflictingReservations && conflictAlert.conflictingReservations.length > 0 && (
                                  <div>
                                    <strong>충돌하는 예약:</strong>
                                    <ul className="mb-0 mt-1">
                                      {conflictAlert.conflictingReservations.map((res, index) => (
                                        <li key={index}>
                                          {res.guestName} - {formatDate(res.date)} {formatTime(res.time)} ({res.duration}시간)
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </Alert>
                            )}

                            {/* 예약 정보 입력 */}
                            <Row className="mb-3">
                              <Col md={12}>
                                <Form.Group className="mb-3">
                                  <Form.Label className="fw-semibold">
                                    <i className="bi bi-calendar3 me-2"></i>
                                    예약 날짜
                                  </Form.Label>
                                  <DatePicker
                                    selected={date ? new Date(date) : null}
                                    onChange={(date) => {
                                      if (date) {
                                        const year = date.getFullYear();
                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                        const day = String(date.getDate()).padStart(2, '0');
                                        setDate(`${year}-${month}-${day}`);
                                      } else {
                                        setDate('');
                                      }
                                    }}
                                    dateFormat="yyyy년 MM월 dd일"
                                    minDate={new Date()}
                                    className="form-control"
                                    placeholderText="날짜를 선택하세요"
                                    required
                                  />
                                </Form.Group>
                              </Col>
                            </Row>

                            <Row className="mb-3">
                              <Col md={8}>
                                <Form.Group>
                                  <Form.Label className="fw-semibold">
                                    <i className="bi bi-clock me-2"></i>
                                    예약 시간
                                  </Form.Label>
                                  <DatePicker
                                    selected={time ? new Date(`2000-01-01T${time}:00`) : null}
                                    onChange={(date) => {
                                      if (date) {
                                        const hours = date.getHours().toString().padStart(2, '0');
                                        const minutes = date.getMinutes().toString().padStart(2, '0');
                                        setTime(`${hours}:${minutes}`);
                                      } else {
                                        setTime('');
                                      }
                                    }}
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={15}
                                    timeCaption="시간"
                                    timeFormat="HH:mm"
                                    dateFormat="HH:mm"
                                    className="form-control"
                                    placeholderText="시간을 선택하세요"
                                    required
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={4}>
                                <Form.Group>
                                  <Form.Label className="fw-semibold">
                                    <i className="bi bi-hourglass me-2"></i>
                                    사용 시간
                                  </Form.Label>
                                  <Form.Select
                                    value={duration}
                                    onChange={(e) => setDuration(parseInt(e.target.value))}
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
                              </Col>
                            </Row>

                            <Form.Group className="mb-3">
                              <Form.Label className="fw-semibold">
                                <i className="bi bi-clipboard me-2"></i>
                                사용 목적
                              </Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={3}
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                placeholder="회의실 사용 목적을 입력하세요"
                                required
                              />
                            </Form.Group>

                            <div className="d-grid">
                              <Button type="submit" variant="success" size="lg">
                                <i className="bi bi-shield-check me-2"></i>
                                Passkey로 예약하기
                              </Button>
                            </div>
                          </Form>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div className="mb-4">
                            <i className="bi bi-shield-x" style={{ fontSize: '3rem', color: '#dc3545' }}></i>
                            <h5 className="mt-3">Passkey 인증이 필요합니다</h5>
                            <p className="text-muted">
                              등록된 Passkey로 인증하여 간편하게 예약하세요
                            </p>
                          </div>

                          <div className="d-grid gap-2 col-md-6 mx-auto">
                            <Button
                              variant="primary"
                              size="lg"
                              onClick={handlePasskeyAuth}
                              disabled={isAuthenticating}
                            >
                              {isAuthenticating ? (
                                <>
                                  <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    className="me-2"
                                  />
                                  인증 중...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-shield-check me-2"></i>
                                  Passkey로 인증하기
                                </>
                              )}
                            </Button>

                            <small className="text-muted">
                              Passkey가 없으시면 상단의 "Passkey 등록" 버튼을 클릭하여 먼저 등록하세요
                            </small>
                          </div>
                        </div>
                      )}
                    </Tab>

                    {/* 수기 입력 탭 */}
                    <Tab eventKey="manual" title={
                      <span>
                        <i className="bi bi-pencil me-1"></i>
                        직접 입력
                      </span>
                    }>
                      <Form onSubmit={handleSubmit}>
                        {/* 충돌 경고 메시지 */}
                        {conflictAlert.show && (
                          <Alert variant={conflictAlert.type} className="mb-3">
                            <Alert.Heading>
                              <i className="bi bi-exclamation-triangle me-2"></i>
                              예약 시간 충돌
                            </Alert.Heading>
                            <p className="mb-2">{conflictAlert.message}</p>
                            {conflictAlert.conflictingReservations && conflictAlert.conflictingReservations.length > 0 && (
                              <div>
                                <strong>충돌하는 예약:</strong>
                                <ul className="mb-0 mt-1">
                                  {conflictAlert.conflictingReservations.map((res, index) => (
                                    <li key={index}>
                                      {res.guestName} - {formatDate(res.date)} {formatTime(res.time)} ({res.duration}시간)
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </Alert>
                        )}

                        <Row className="mb-3">
                          <Col md={12}>
                            <Form.Group className="mb-3">
                              <Form.Label className="fw-semibold">
                                <i className="bi bi-calendar3 me-2"></i>
                                예약 날짜
                              </Form.Label>
                              <DatePicker
                                selected={date ? new Date(date) : null}
                                onChange={(date) => {
                                  if (date) {
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    setDate(`${year}-${month}-${day}`);
                                  } else {
                                    setDate('');
                                  }
                                }}
                                dateFormat="yyyy년 MM월 dd일"
                                minDate={new Date()}
                                className="form-control"
                                placeholderText="날짜를 선택하세요"
                                required
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        <Row className="mb-3">
                          <Col md={8}>
                            <Form.Group>
                              <Form.Label className="fw-semibold">
                                <i className="bi bi-clock me-2"></i>
                                예약 시간
                              </Form.Label>
                              <DatePicker
                                selected={time ? new Date(`2000-01-01T${time}:00`) : null}
                                onChange={(date) => {
                                  if (date) {
                                    const hours = date.getHours().toString().padStart(2, '0');
                                    const minutes = date.getMinutes().toString().padStart(2, '0');
                                    setTime(`${hours}:${minutes}`);
                                  } else {
                                    setTime('');
                                  }
                                }}
                                showTimeSelect
                                showTimeSelectOnly
                                timeIntervals={15}
                                timeCaption="시간"
                                timeFormat="HH:mm"
                                dateFormat="HH:mm"
                                className="form-control"
                                placeholderText="시간을 선택하세요"
                                required
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label className="fw-semibold">
                                <i className="bi bi-hourglass me-2"></i>
                                사용 시간
                              </Form.Label>
                              <Form.Select
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value))}
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
                          </Col>
                        </Row>

                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">
                            <i className="bi bi-person me-2"></i>
                            예약자명
                          </Form.Label>
                          <Form.Control
                            type="text"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder="예약자 이름을 입력하세요"
                            required
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label className="fw-semibold">
                            <i className="bi bi-clipboard me-2"></i>
                            사용 목적
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            placeholder="회의실 사용 목적을 입력하세요"
                            required
                          />
                        </Form.Group>

                        <div className="d-grid">
                          <Button type="submit" variant="primary" size="lg">
                            <i className="bi bi-check-circle me-2"></i>
                            예약하기
                          </Button>
                        </div>
                      </Form>
                    </Tab>
                  </Tabs>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="justify-content-between">
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            예약 정보는 안전하게 저장됩니다.
          </small>
          <Button variant="secondary" onClick={onHide}>
            <i className="bi bi-x-circle me-1"></i>
            닫기
          </Button>
        </Modal.Footer>

      </Modal>
    </>
  );
};

export default RoomReservationModal; 