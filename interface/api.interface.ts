/** RFC 7807 body returned by the API's GlobalExceptionHandler. */
export interface ProblemDetail {
  title?: string
  detail?: string
  status?: number
  /** Present on validation failures: field name to message. */
  errors?: Record<string, string>
}

/** A failed request, reshaped for the form that triggered it. */
export interface FormError {
  message: string
  /** Field name to message, when the API rejected specific inputs. */
  fieldErrors?: Record<string, string>
}
