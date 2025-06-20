export class BaseResponseDto<T> {
    statusCode: number;
    message: string;
    data?: T;
    
    constructor(statusCode: number, message: string, data?: T) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }

    static success<T>(data: T, message: string = '성공적으로 처리되었습니다.'): BaseResponseDto<T> {
        return new BaseResponseDto<T>(200, message, data);
    }

    static created<T>(data: T, message: string = '성공적으로 생성되었습니다.'): BaseResponseDto<T> {
        return new BaseResponseDto<T>(201, message, data);
    }

    static noContent(message: string = '성공적으로 처리되었습니다.'): BaseResponseDto<void> {
        return new BaseResponseDto<void>(204, message);
    }
}