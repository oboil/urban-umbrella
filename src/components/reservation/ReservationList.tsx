import React, { useState, useMemo } from 'react';
import { Card, Badge, Row, Col, Button, Modal, Alert, Form, InputGroup } from 'react-bootstrap';
import type { Reservation } from '../../types/reservation';
import { deleteReservation } from '../../data/reservationData';

interface ReservationListProps {
  reservations: Reservation[];
  title?: string;
  showDeleteButton?: boolean;
}

const ReservationList: React.FC<ReservationListProps> = ({ 
  reservations, 
  title = "예약 목록",
  showDeleteButton = true
}) => {
  const [deleteModalShow, setDeleteModalShow] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [deleteVariant, setDeleteVariant] = useState<'success' | 'danger'>('success');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (timeString: string): string => {
    return timeString;
  };

  const getReservationStatus = (reservation: Reservation): 'completed' | 'ongoing' | 'upcoming' => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

    if (reservation.date < today) {
      return 'completed';
    } else if (reservation.date === today) {
      if (currentTime >= reservation.startTime && currentTime <= reservation.endTime) {
        return 'ongoing';
      } else if (currentTime > reservation.endTime) {
        return 'completed';
      } else {
        return 'upcoming';
      }
    } else {
      return 'upcoming';
    }
  };

  const getStatusBadge = (reservation: Reservation) => {
    const status = getReservationStatus(reservation);
    
    switch (status) {
      case 'completed':
        return <Badge bg="secondary"><i className="bi bi-check-circle me-1"></i>완료</Badge>;
      case 'ongoing':
        return <Badge bg="success"><i className="bi bi-play-circle me-1"></i>진행중</Badge>;
      case 'upcoming':
        return <Badge bg="primary"><i className="bi bi-clock me-1"></i>예정</Badge>;
      default:
        return <Badge bg="secondary">완료</Badge>;
    }
  };

  const canDeleteReservation = (reservation: Reservation): boolean => {
    const status = getReservationStatus(reservation);
    return status === 'upcoming'; // 예정된 예약만 삭제 가능
  };

  const filteredReservations = useMemo(() => {
    let filtered = reservations;

    // 상태 필터
    if (filterStatus !== 'all') {
      filtered = filtered.filter(reservation => {
        const status = getReservationStatus(reservation);
        return status === filterStatus;
      });
    }

    // 검색 필터
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(reservation =>
        reservation.title.toLowerCase().includes(query) ||
        reservation.userName.toLowerCase().includes(query) ||
        reservation.classroomId.toString().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.startTime.localeCompare(b.startTime);
    });
  }, [reservations, filterStatus, searchQuery]);

  const handleDeleteClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setDeleteModalShow(true);
    setDeleteMessage('');
  };

  const handleDeleteConfirm = async () => {
    if (!selectedReservation) return;

    try {
      const result = deleteReservation(selectedReservation.id);
      
      if (result.success) {
        setDeleteMessage(result.message);
        setDeleteVariant('success');
        setTimeout(() => {
          setDeleteModalShow(false);
          setSelectedReservation(null);
          setDeleteMessage('');
        }, 1500);
      } else {
        setDeleteMessage(result.message);
        setDeleteVariant('danger');
      }
    } catch (error) {
      setDeleteMessage('예약 삭제 중 오류가 발생했습니다.');
      setDeleteVariant('danger');
    }
  };

  if (reservations.length === 0) {
    return (
      <Card className="text-center">
        <Card.Body>
          <i className="bi bi-calendar-x display-4 text-muted"></i>
          <h5 className="mt-3 text-muted">예약이 없습니다</h5>
          <p className="text-muted">새로운 예약을 추가해보세요.</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-list-ul me-2"></i>
              {title}
              <Badge bg="light" text="dark" className="ms-2">{filteredReservations.length}건</Badge>
            </h5>
          </div>
        </Card.Header>
        
        {/* 필터 및 검색 */}
        <Card.Body className="border-bottom">
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small">상태 필터</Form.Label>
                <Form.Select 
                  size="sm" 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">전체</option>
                  <option value="upcoming">예정</option>
                  <option value="ongoing">진행중</option>
                  <option value="completed">완료</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="small">검색</Form.Label>
                <InputGroup size="sm">
                  <Form.Control
                    type="text"
                    placeholder="제목, 예약자, 강의실 번호로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button variant="outline-secondary" onClick={() => setSearchQuery('')}>
                    <i className="bi bi-x"></i>
                  </Button>
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>

        <Card.Body className="p-0">
          {filteredReservations.length === 0 ? (
            <div className="text-center p-4">
              <i className="bi bi-search display-6 text-muted"></i>
              <h6 className="mt-3 text-muted">검색 결과가 없습니다</h6>
              <p className="text-muted small">다른 검색어를 시도해보세요.</p>
            </div>
          ) : (
            filteredReservations.map((reservation, index) => (
              <div 
                key={reservation.id} 
                className={`p-3 ${index !== filteredReservations.length - 1 ? 'border-bottom' : ''}`}
              >
                <Row className="align-items-center">
                  <Col md={7}>
                    <div className="d-flex align-items-center mb-2">
                      <h6 className="mb-0 me-3">{reservation.title}</h6>
                      {getStatusBadge(reservation)}
                    </div>
                    <div className="text-muted small">
                      <div className="mb-1">
                        <i className="bi bi-calendar-date me-2"></i>
                        {formatDate(reservation.date)}
                      </div>
                      <div className="mb-1">
                        <i className="bi bi-clock me-2"></i>
                        {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                      </div>
                      <div>
                        <i className="bi bi-person me-2"></i>
                        {reservation.userName}
                      </div>
                    </div>
                  </Col>
                  <Col md={3} className="text-md-center">
                    <div className="text-muted small">
                      <div className="mb-1">
                        <i className="bi bi-door-open me-2"></i>
                        강의실 {reservation.classroomId}
                      </div>
                      <div>
                        <i className="bi bi-clock-history me-2"></i>
                        {new Date(reservation.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </Col>
                  <Col md={2} className="text-md-end">
                    {showDeleteButton && canDeleteReservation(reservation) && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteClick(reservation)}
                        title="예약 취소"
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    )}
                    {!canDeleteReservation(reservation) && showDeleteButton && (
                      <small className="text-muted">취소 불가</small>
                    )}
                  </Col>
                </Row>
              </div>
            ))
          )}
        </Card.Body>
      </Card>

      {/* 예약 삭제 확인 모달 */}
      <Modal show={deleteModalShow} onHide={() => setDeleteModalShow(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-exclamation-triangle me-2 text-warning"></i>
            예약 취소 확인
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          {deleteMessage && (
            <Alert variant={deleteVariant} className="mb-3">
              <i className={`bi bi-${deleteVariant === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
              {deleteMessage}
            </Alert>
          )}
          
          {!deleteMessage && selectedReservation && (
            <div>
              <p className="mb-3">정말로 다음 예약을 취소하시겠습니까?</p>
              <Card className="bg-light">
                <Card.Body>
                  <h6 className="card-title">{selectedReservation.title}</h6>
                  <div className="small text-muted">
                    <div><strong>날짜:</strong> {formatDate(selectedReservation.date)}</div>
                    <div><strong>시간:</strong> {selectedReservation.startTime} - {selectedReservation.endTime}</div>
                    <div><strong>강의실:</strong> {selectedReservation.classroomId}번</div>
                    <div><strong>예약자:</strong> {selectedReservation.userName}</div>
                  </div>
                </Card.Body>
              </Card>
              <div className="mt-3 text-muted small">
                <i className="bi bi-info-circle me-2"></i>
                취소된 예약은 복구할 수 없습니다.
              </div>
            </div>
          )}
        </Modal.Body>
        
        {!deleteMessage && (
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setDeleteModalShow(false)}>
              취소
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              <i className="bi bi-trash me-2"></i>
              예약 취소
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </>
  );
};

export default ReservationList; 