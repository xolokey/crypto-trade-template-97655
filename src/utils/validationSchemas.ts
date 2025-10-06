import { ValidationSchema } from "@/hooks/useFormValidation";

// Alert Form Validation
export interface AlertFormValues {
  targetPrice: string;
  targetPercent: string;
}

export const alertValidationSchema: ValidationSchema<AlertFormValues> = {
  targetPrice: (value: string) => {
    if (!value || value.trim() === "") {
      return "Price is required";
    }

    const num = parseFloat(value);

    if (isNaN(num)) {
      return "Must be a valid number";
    }

    if (num <= 0) {
      return "Price must be greater than 0";
    }

    if (num > 1000000) {
      return "Price is too high (max: 1,000,000)";
    }

    return null;
  },

  targetPercent: (value: string) => {
    if (!value || value.trim() === "") {
      return "Percentage is required";
    }

    const num = parseFloat(value);

    if (isNaN(num)) {
      return "Must be a valid number";
    }

    if (num <= 0) {
      return "Percentage must be greater than 0";
    }

    if (num > 100) {
      return "Percentage cannot exceed 100%";
    }

    return null;
  },
};

// Portfolio Form Validation
export interface PortfolioFormValues {
  quantity: string;
  price: string;
}

export const portfolioValidationSchema: ValidationSchema<PortfolioFormValues> =
  {
    quantity: (value: string) => {
      if (!value || value.trim() === "") {
        return "Quantity is required";
      }

      const num = parseInt(value);

      if (isNaN(num)) {
        return "Must be a valid number";
      }

      if (num <= 0) {
        return "Quantity must be at least 1";
      }

      if (!Number.isInteger(parseFloat(value))) {
        return "Quantity must be a whole number";
      }

      if (num > 1000000) {
        return "Quantity is too high (max: 1,000,000)";
      }

      return null;
    },

    price: (value: string) => {
      if (!value || value.trim() === "") {
        return "Price is required";
      }

      const num = parseFloat(value);

      if (isNaN(num)) {
        return "Must be a valid number";
      }

      if (num <= 0) {
        return "Price must be greater than 0";
      }

      if (num > 1000000) {
        return "Price is too high (max: 1,000,000)";
      }

      return null;
    },
  };

// Generic number validation
export const createNumberValidator = (
  fieldName: string,
  min?: number,
  max?: number,
  allowDecimals: boolean = true
) => {
  return (value: string) => {
    if (!value || value.trim() === "") {
      return `${fieldName} is required`;
    }

    const num = allowDecimals ? parseFloat(value) : parseInt(value);

    if (isNaN(num)) {
      return "Must be a valid number";
    }

    if (!allowDecimals && !Number.isInteger(parseFloat(value))) {
      return "Must be a whole number";
    }

    if (min !== undefined && num < min) {
      return `${fieldName} must be at least ${min}`;
    }

    if (max !== undefined && num > max) {
      return `${fieldName} cannot exceed ${max}`;
    }

    return null;
  };
};

// Generic string validation
export const createStringValidator = (
  fieldName: string,
  minLength?: number,
  maxLength?: number,
  pattern?: RegExp
) => {
  return (value: string) => {
    if (!value || value.trim() === "") {
      return `${fieldName} is required`;
    }

    const trimmed = value.trim();

    if (minLength !== undefined && trimmed.length < minLength) {
      return `${fieldName} must be at least ${minLength} characters`;
    }

    if (maxLength !== undefined && trimmed.length > maxLength) {
      return `${fieldName} cannot exceed ${maxLength} characters`;
    }

    if (pattern && !pattern.test(trimmed)) {
      return `${fieldName} format is invalid`;
    }

    return null;
  };
};
