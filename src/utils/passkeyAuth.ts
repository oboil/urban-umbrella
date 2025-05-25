import type { PasskeyUser, AuthSession, QRAuthData } from '../types/auth';

const RP_ID = window.location.hostname;
const RP_NAME = 'Room Reservation System';

// UTF-8을 지원하는 안전한 base64 인코딩/디코딩 함수들
const safeBase64Encode = (str: string): string => {
  // UTF-8 문자열을 안전하게 base64로 인코딩
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

const safeBase64Decode = (base64: string): string => {
  // UTF-8을 지원하는 안전한 base64 디코딩
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

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const generateRandomId = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return arrayBufferToBase64(array.buffer);
};

// 간단한 해시 함수 (실제 프로덕션에서는 더 강력한 암호화 필요)
const simpleHash = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return arrayBufferToBase64(hashBuffer);
};

// LocalStorage를 사용한 사용자 데이터 저장
const USERS_KEY = 'passkey_users';
const SESSION_KEY = 'auth_session';

const saveUser = (user: PasskeyUser): void => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const getUsers = (): PasskeyUser[] => {
  const stored = localStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const getUser = (id: string): PasskeyUser | null => {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
};

const getUserByCredentialId = (credentialId: string): PasskeyUser | null => {
  const users = getUsers();
  return users.find(u => u.credentialId === credentialId) || null;
};

// 세션 관리
const saveSession = (session: AuthSession): void => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

const getSession = (): AuthSession | null => {
  const stored = localStorage.getItem(SESSION_KEY);
  return stored ? JSON.parse(stored) : null;
};

const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

// Passkey 등록
export const registerPasskey = async (username: string, displayName: string): Promise<PasskeyUser> => {
  if (!navigator.credentials || !window.PublicKeyCredential) {
    throw new Error('이 브라우저는 Passkey를 지원하지 않습니다.');
  }

  const userId = generateRandomId();
  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: RP_NAME,
      id: RP_ID,
    },
    user: {
      id: new TextEncoder().encode(userId),
      name: username,
      displayName: displayName,
    },
    pubKeyCredParams: [
      {
        alg: -7, // ES256
        type: 'public-key',
      },
      {
        alg: -257, // RS256
        type: 'public-key',
      },
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
    },
    timeout: 60000,
    attestation: 'direct',
  };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Passkey 생성에 실패했습니다.');
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    
    const user: PasskeyUser = {
      id: userId,
      username,
      displayName,
      credentialId: arrayBufferToBase64(credential.rawId),
      publicKey: arrayBufferToBase64(response.getPublicKey() || new ArrayBuffer(0)),
      createdAt: new Date().toISOString(),
    };

    saveUser(user);

    // 등록 성공 후 자동으로 세션 생성
    const session: AuthSession = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      isAuthenticated: true,
      loginTime: new Date().toISOString(),
    };

    saveSession(session);
    return user;
  } catch (error) {
    console.error('Passkey 등록 오류:', error);
    throw new Error('Passkey 등록에 실패했습니다.');
  }
};

// Passkey 인증
export const authenticatePasskey = async (): Promise<AuthSession> => {
  if (!navigator.credentials || !window.PublicKeyCredential) {
    throw new Error('이 브라우저는 Passkey를 지원하지 않습니다.');
  }

  const users = getUsers();
  if (users.length === 0) {
    throw new Error('등록된 Passkey가 없습니다.');
  }

  const challenge = new Uint8Array(32);
  crypto.getRandomValues(challenge);

  const allowCredentials = users.map(user => ({
    id: base64ToArrayBuffer(user.credentialId),
    type: 'public-key' as const,
  }));

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    allowCredentials,
    timeout: 60000,
    userVerification: 'required',
  };

  try {
    const credential = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('인증에 실패했습니다.');
    }

    const credentialId = arrayBufferToBase64(credential.rawId);
    const user = getUserByCredentialId(credentialId);

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    const session: AuthSession = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      isAuthenticated: true,
      loginTime: new Date().toISOString(),
    };

    saveSession(session);
    return session;
  } catch (error) {
    console.error('Passkey 인증 오류:', error);
    throw new Error('인증에 실패했습니다.');
  }
};

// QR 코드용 인증 데이터 생성
export const generateQRAuthData = async (userId?: string): Promise<QRAuthData> => {
  const session = getSession();
  const targetUserId = userId || session?.userId;
  
  if (!targetUserId) {
    throw new Error('사용자 ID가 필요합니다.');
  }

  const user = getUser(targetUserId);
  if (!user) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }

  const challenge = generateRandomId();
  const timestamp = Date.now();
  
  const authData: QRAuthData = {
    challenge,
    userId: user.id,
    username: user.displayName,
    timestamp,
  };

  // 간단한 서명 생성 (실제로는 더 강력한 암호화 필요)
  const dataToSign = JSON.stringify({ challenge, userId: user.id, timestamp });
  authData.signature = await simpleHash(dataToSign + user.credentialId);

  return authData;
};

// QR 코드 데이터 검증
export const verifyQRAuthData = async (authData: QRAuthData): Promise<boolean> => {
  try {
    const user = getUser(authData.userId);
    if (!user) return false;

    // 타임스탬프 검증 (5분 유효)
    const now = Date.now();
    if (now - authData.timestamp > 5 * 60 * 1000) {
      return false;
    }

    // 서명 검증
    const dataToSign = JSON.stringify({ 
      challenge: authData.challenge, 
      userId: authData.userId, 
      timestamp: authData.timestamp 
    });
    const expectedSignature = await simpleHash(dataToSign + user.credentialId);
    
    return authData.signature === expectedSignature;
  } catch (error) {
    console.error('QR 인증 데이터 검증 오류:', error);
    return false;
  }
};

// 현재 세션 정보 가져오기
export const getCurrentSession = (): AuthSession | null => {
  return getSession();
};

// 로그아웃
export const logout = (): void => {
  clearSession();
};

// 등록된 사용자 목록 가져오기
export const getRegisteredUsers = (): PasskeyUser[] => {
  return getUsers();
}; 