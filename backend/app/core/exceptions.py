"""Domain errors. Services raise these; main.py turns them into HTTP responses."""


class AppError(Exception):
    status_code = 400

    def __init__(self, detail: str):
        super().__init__(detail)
        self.detail = detail


class NotFoundError(AppError):
    status_code = 404


class ConflictError(AppError):
    status_code = 409


class AuthError(AppError):
    status_code = 401


class FileValidationError(AppError):
    status_code = 422


class FileTooLargeError(AppError):
    status_code = 413


class AIServiceError(AppError):
    status_code = 502
