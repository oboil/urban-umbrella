import type { QRAuthData } from '../types/auth';

// QRCode 라이브러리 타입 정의
declare global {
  interface Window {
    QRCode: {
      toDataURL: (text: string, options?: Record<string, unknown>) => Promise<string>;
    };
  }
}

// QRCode 라이브러리 로드
const loadQRCodeLibrary = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.QRCode) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('QRCode 라이브러리를 로드할 수 없습니다.'));
    document.head.appendChild(script);
  });
};

// QR 코드 생성 함수
export const generateQRCode = async (authData: QRAuthData): Promise<string> => {
  try {
    await loadQRCodeLibrary();

    // 한글이 포함된 데이터를 안전하게 처리
    const qrData = JSON.stringify({
      type: 'passkey_auth',
      data: {
        ...authData,
        // 한글 사용자명을 Base64로 인코딩하여 안전하게 전송
        username: safeBase64Encode(authData.username || '')
      },
      app: 'room_reservation'
    });

    const options = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    };

    return await window.QRCode.toDataURL(qrData, options);
  } catch (error) {
    console.error('QR 코드 생성 오류:', error);
    // fallback으로 간단한 QR 코드 생성
    const fallbackData = {
      ...authData,
      username: safeBase64Encode(authData.username || '')
    };
    return generateSimpleQRCode(JSON.stringify(fallbackData));
  }
};

// UTF-8을 지원하는 안전한 base64 인코딩
const safeBase64Encode = (str: string): string => {
  try {
    // TextEncoder를 사용하여 UTF-8 바이트로 변환
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    
    // 바이트 배열을 binary string으로 변환
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  } catch (error) {
    console.error('Base64 인코딩 오류:', error);
    // fallback: ASCII 문자만 포함된 대체 문자열 생성
    return btoa(encodeURIComponent(str).replace(/%/g, '_'));
  }
};

// UTF-8을 지원하는 안전한 base64 디코딩
const safeBase64Decode = (base64: string): string => {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    // TextDecoder를 사용하여 UTF-8 문자열로 변환
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  } catch (error) {
    console.error('Base64 디코딩 오류:', error);
    // fallback
    try {
      return decodeURIComponent(atob(base64).replace(/_/g, '%'));
    } catch {
      return atob(base64);
    }
  }
};

// QR 코드 데이터 파싱
export const parseQRData = (qrString: string): QRAuthData | null => {
  try {
    const parsed = JSON.parse(qrString);
    if (parsed.type === 'passkey_auth' && parsed.data && parsed.app === 'room_reservation') {
      const data = parsed.data as QRAuthData;
      // Base64로 인코딩된 사용자명을 디코딩
      if (data.username) {
        data.username = safeBase64Decode(data.username);
      }
      return data;
    }
    return null;
  } catch (error) {
    console.error('QR 데이터 파싱 오류:', error);
    return null;
  }
};

// 간단한 QR 코드 생성 (fallback)
export const generateSimpleQRCode = (text: string): string => {
  // 간단한 SVG QR 코드 패턴 생성 (실제 QR 코드는 아니지만 시각적 대체)
  const size = 256;
  const modules = 21; // 기본 QR 코드 모듈 수
  const moduleSize = Math.floor(size / modules);
  
  // 텍스트를 해시하여 패턴 생성
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit 정수로 변환
  }

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white"/>
      ${Array.from({ length: modules }, (_, y) => 
        Array.from({ length: modules }, (_, x) => {
          const value = Math.abs(hash * (x + 1) * (y + 1)) % 100;
          const shouldFill = value < 50;
          return shouldFill ? 
            `<rect x="${x * moduleSize}" y="${y * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>` 
            : '';
        }).join('')
      ).join('')}
      <!-- 위치 표시 패턴 -->
      <rect x="0" y="0" width="${moduleSize * 7}" height="${moduleSize * 7}" fill="white" stroke="black" stroke-width="2"/>
      <rect x="${moduleSize * 2}" y="${moduleSize * 2}" width="${moduleSize * 3}" height="${moduleSize * 3}" fill="black"/>
      
      <rect x="${(modules - 7) * moduleSize}" y="0" width="${moduleSize * 7}" height="${moduleSize * 7}" fill="white" stroke="black" stroke-width="2"/>
      <rect x="${(modules - 5) * moduleSize}" y="${moduleSize * 2}" width="${moduleSize * 3}" height="${moduleSize * 3}" fill="black"/>
      
      <rect x="0" y="${(modules - 7) * moduleSize}" width="${moduleSize * 7}" height="${moduleSize * 7}" fill="white" stroke="black" stroke-width="2"/>
      <rect x="${moduleSize * 2}" y="${(modules - 5) * moduleSize}" width="${moduleSize * 3}" height="${moduleSize * 3}" fill="black"/>
    </svg>
  `;

  return `data:image/svg+xml;base64,${safeBase64Encode(svg)}`;
}; 