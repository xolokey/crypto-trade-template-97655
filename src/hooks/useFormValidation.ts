import { useState, useCallback } from 'react';

export type ValidationRule<T> = (value: T) => string | null;
export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

interface UseFormValidationReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  handleChange: (field: keyof T, value: T[keyof T]) => void;
  handleBlur: (field: keyof T) => void;
  validateField: (field: keyof T) => boolean;
  validateAll: () => boolean;
  reset: () => void;
  setValues: (values: T) => void;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationSchema: ValidationSchema<T>
): UseFormValidationReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback(
    (field: keyof T): boolean => {
      const validator = validationSchema[field];
      if (!validator) return true;

      const error = validator(values[field]);
      setErrors((prev) => ({
        ...prev,
        [field]: error || undefined,
      }));

      return error === null;
    },
    [values, validationSchema]
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationSchema).forEach((key) => {
      const field = key as keyof T;
      const validator = validationSchema[field];
      if (validator) {
        const error = validator(values[field]);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationSchema]);

  const handleChange = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setValuesState((prev) => ({ ...prev, [field]: value }));

      // Validate immediately if field has been touched
      if (touched[field]) {
        const validator = validationSchema[field];
        if (validator) {
          const error = validator(value);
          setErrors((prev) => ({
            ...prev,
            [field]: error || undefined,
          }));
        }
      }
    },
    [touched, validationSchema]
  );

  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      validateField(field);
    },
    [validateField]
  );

  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setValues = useCallback((newValues: T) => {
    setValuesState(newValues);
  }, []);

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    validateField,
    validateAll,
    reset,
    setValues,
  };
}
