# 🔐 Passkey 설정 및 문제 해결 가이드

## 🚨 "브라우저가 Passkey를 지원하지 않습니다" 오류 해결

### 📋 문제 진단

Passkey 등록 버튼을 눌렀을 때 오류가 발생하는 경우, 다음 단계를 따라 문제를 진단하세요:

1. **개발자 도구 콘솔 확인**
   - `F12` → Console 탭에서 오류 메시지 확인
   - 구체적인 문제 원인이 로깅됩니다.

2. **환경 정보 확인**
   - 모달에서 표시되는 환경 정보를 확인하세요
   - 특히 "보안 컨텍스트" 항목을 주의깊게 보세요

### 🔧 해결 방법

#### 방법 1: HTTPS 개발 서버 사용 (권장)

```bash
# 개발 서버를 HTTPS로 실행
npm run dev
# 또는
yarn dev
```

**주의**: 첫 실행 시 브라우저에서 "안전하지 않음" 경고가 나타날 수 있습니다.
1. "고급" 클릭
2. "localhost(안전하지 않음)으로 이동" 클릭
3. 자체 서명 인증서를 허용

#### 방법 2: localhost 접속 확인

현재 접속 URL이 다음 중 하나인지 확인:
- `https://localhost:5173`
- `http://localhost:5173` (HTTP도 localhost에서는 허용)
- `http://127.0.0.1:5173`

#### 방법 3: 브라우저 설정 확인

**Chrome 브라우저**:
1. `chrome://settings/privacy` 이동
2. "보안" → "고급" 설정 확인
3. "안전하지 않은 사이트" 관련 설정 확인

**Safari 브라우저**:
1. "개발" 메뉴 → "실험적인 기능" 확인
2. WebAuthn 관련 기능 활성화

### 🧪 테스트 방법

#### 1. 독립 데모 페이지 테스트
```bash
# 프로젝트 루트 디렉토리에서
# demo.html 파일을 브라우저에서 직접 열기
open demo.html  # macOS
# 또는 브라우저에서 file:// 프로토콜로 열기
```

#### 2. Passkey 지원 확인 스크립트
브라우저 콘솔에서 다음 코드 실행:

```javascript
console.log('=== Passkey 지원 확인 ===');
console.log('navigator.credentials:', !!navigator.credentials);
console.log('PublicKeyCredential:', !!window.PublicKeyCredential);
console.log('isSecureContext:', window.isSecureContext);
console.log('프로토콜:', window.location.protocol);
console.log('호스트:', window.location.hostname);

// 종합 지원 여부
const isSupported = navigator.credentials && 
                   window.PublicKeyCredential && 
                   (window.isSecureContext || 
                    ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname));

console.log('✅ Passkey 지원:', isSupported);
```

### 🌐 브라우저별 지원 현황

| 브라우저 | 버전 | 지원 상태 | 비고 |
|---------|------|---------|------|
| Chrome | 67+ | ✅ 완전 지원 | 권장 브라우저 |
| Safari | 14+ | ✅ 완전 지원 | macOS/iOS |
| Edge | 79+ | ✅ 완전 지원 | Chromium 기반 |
| Firefox | 60+ | ⚠️ 부분 지원 | 설정 필요 |

### 🚀 프로덕션 환경 배포

프로덕션 환경에서는 반드시 **유효한 SSL 인증서**가 있는 HTTPS 환경에서 배포해야 합니다.

```bash
# 빌드
npm run build

# HTTPS 환경에 배포
# 예: Netlify, Vercel, AWS S3 + CloudFront 등
```

### 🔍 추가 디버깅

문제가 지속될 경우:

1. **브라우저 재시작**
2. **시크릿/비공개 모드**에서 테스트
3. **다른 브라우저**에서 테스트
4. **콘솔 오류 메시지** 확인 및 공유

### 📞 문의

위 방법으로도 해결되지 않는 경우, 다음 정보와 함께 문의하세요:
- 브라우저 종류 및 버전
- 운영체제
- 접속 URL
- 콘솔 오류 메시지
- 환경 정보 (모달에서 표시되는 정보) 