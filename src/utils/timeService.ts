// src/utils/timeService.ts
// 공공 API에서 현재 시간을 가져오는 서비스
class TimeService {
    private cachedTime: Date | null = null;
    private lastFetchTime: number = 0;
    private readonly CACHE_DURATION = 60000; // 1분 캐시
    private timeOffset: number = 0; // 서버와 로컬 시간 차이
  
    async getCurrentTime(): Promise<Date> {
      const now = Date.now();
      
      // 캐시된 시간이 있고 1분 이내라면 오프셋 계산해서 반환
      if (this.cachedTime && (now - this.lastFetchTime) < this.CACHE_DURATION) {
        const localElapsed = now - this.lastFetchTime;
        return new Date(this.cachedTime.getTime() + localElapsed);
      }
  
      try {
        // 요청 시작 시간 기록
        const requestStart = Date.now();
        
        // 한국 표준시 API 호출 (여러 fallback API 준비)
        const serverTime = await this.fetchServerTime();
        
        // 네트워크 지연 시간 보정
        const networkDelay = (Date.now() - requestStart) / 2;
        const correctedServerTime = new Date(serverTime.getTime() + networkDelay);
        
        this.cachedTime = correctedServerTime;
        this.lastFetchTime = Date.now();
        this.timeOffset = correctedServerTime.getTime() - Date.now();
        
        console.log(`🕐 서버 시간 동기화 완료: ${correctedServerTime.toLocaleString('ko-KR')} (오프셋: ${this.timeOffset}ms)`);
        
        return this.cachedTime;
      } catch (error) {
        console.warn('⚠️ 시간 서버 연결 실패, 로컬 시간 사용:', error);
        
        // fallback으로 로컬 시간 사용하되, 기존 오프셋이 있다면 적용
        const fallbackTime = new Date(Date.now() + this.timeOffset);
        this.cachedTime = fallbackTime;
        this.lastFetchTime = Date.now();
        
        return fallbackTime;
      }
    }
  
    // 여러 시간 API를 시도하는 함수
    private async fetchServerTime(): Promise<Date> {
      const timeAPIs = [
        {
            url: 'https://timeapi.io/api/Time/current/zone?timeZone=Asia/Seoul',
            parser: (data: any) => new Date(data.dateTime)
          },
          {
            url: 'https://api.ipgeolocation.io/timezone?apiKey=free&tz=Asia/Seoul',
            parser: (data: any) => new Date(data.date_time)
          },
          // worldtimeapi를 맨 마지막으로 이동 (fallback으로 사용)
          {
            url: 'https://worldtimeapi.org/api/timezone/Asia/Seoul',
            parser: (data: any) => new Date(data.datetime)
          }
      ];
  
      for (const api of timeAPIs) {
        try {
          const response = await fetch(api.url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            // 타임아웃 설정 (5초)
            signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
          });
  
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
  
          const data = await response.json();
          const serverTime = api.parser(data);
          
          // 유효한 시간인지 검증
          if (isNaN(serverTime.getTime())) {
            throw new Error('Invalid date received from server');
          }
  
          console.log(`✅ 시간 API 성공: ${api.url}`);
          return serverTime;
        } catch (error) {
          console.warn(`❌ 시간 API 실패 (${api.url}):`, error);
          continue;
        }
      }
  
      throw new Error('모든 시간 API 연결 실패');
    }
  
    // 동기적으로 현재 시간 추정 (캐시 기반)
    getEstimatedCurrentTime(): Date {
      if (this.cachedTime) {
        const elapsed = Date.now() - this.lastFetchTime;
        return new Date(this.cachedTime.getTime() + elapsed);
      }
      // 캐시가 없으면 오프셋 적용된 로컬 시간
      return new Date(Date.now() + this.timeOffset);
    }
  
    // 오늘 날짜 문자열 반환 (YYYY-MM-DD)
    async getTodayString(): Promise<string> {
      const currentTime = await this.getCurrentTime();
      return currentTime.toISOString().split('T')[0];
    }
  
    // 현재 시간 문자열 반환 (HH:MM)
    async getCurrentTimeString(): Promise<string> {
      const currentTime = await this.getCurrentTime();
      return currentTime.toTimeString().split(' ')[0].substring(0, 5);
    }
  
    // 현재 시간이 특정 시간 범위 내에 있는지 확인
    async isCurrentTimeInRange(startTime: string, endTime: string): Promise<boolean> {
      const current = await this.getCurrentTimeString();
      return current >= startTime && current <= endTime;
    }
  
    // 특정 날짜가 오늘인지 확인
    async isToday(dateString: string): Promise<boolean> {
      const today = await this.getTodayString();
      return dateString === today;
    }
  
    // 디버깅용: 현재 시간 정보 출력
    async getTimeInfo(): Promise<{
      serverTime: string;
      localTime: string;
      offset: number;
      cacheAge: number;
    }> {
      const serverTime = await this.getCurrentTime();
      const localTime = new Date();
      const cacheAge = Date.now() - this.lastFetchTime;
  
      return {
        serverTime: serverTime.toLocaleString('ko-KR'),
        localTime: localTime.toLocaleString('ko-KR'),
        offset: this.timeOffset,
        cacheAge
      };
    }
  
    // 시간 캐시 강제 갱신
    async forceRefresh(): Promise<Date> {
      this.cachedTime = null;
      this.lastFetchTime = 0;
      return await this.getCurrentTime();
    }
  }
  
  export const timeService = new TimeService();
  
  // 앱 시작 시 시간 동기화 (백그라운드)
  timeService.getCurrentTime().catch(error => {
    console.warn('초기 시간 동기화 실패:', error);
  });
  
  // 1시간마다 자동으로 시간 동기화
  setInterval(() => {
    timeService.forceRefresh().catch(error => {
      console.warn('자동 시간 동기화 실패:', error);
    });
  }, 60 * 60 * 1000); // 1시간