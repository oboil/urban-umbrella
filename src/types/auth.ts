export interface PasskeyUser {
  id: string;
  username: string;
  displayName: string;
  credentialId: string;
  publicKey: string;
  createdAt: string;
}

export interface PasskeyCredential {
  id: string;
  rawId: ArrayBuffer;
  response: {
    clientDataJSON: ArrayBuffer;
    attestationObject: ArrayBuffer;
  };
  type: 'public-key';
}

export interface AuthSession {
  userId: string;
  username: string;
  displayName: string;
  isAuthenticated: boolean;
  loginTime: string;
}

export interface QRAuthData {
  challenge: string;
  userId: string;
  username: string;
  timestamp: number;
  signature?: string;
} 