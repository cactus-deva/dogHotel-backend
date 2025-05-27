export const sanitizeString = (input) => {
    if(typeof input !== 'string') {
        return ""
    }
    return input.trim().replace(/[\'\";]/g, "")
}

export const sanitizeNumber = (input) => {
    const number = Number(input)
    if(isNaN(number)) {
        const error = new Error ("Input must be a valid number")
        error.status = 400
        throw error
    }
    return number
}

export const validateMaxLength = (value, maxLength, fieldName = "input") => {
    if(typeof value === 'string' && value.length > maxLength) {
        const error = new Error(`${fieldName} must be under ${maxLength} characters`)
        error.status = 400
        throw error
    }
    return value
}

export const validateMaxNumber = (value, maxNum, fieldName = "input") => {
    if(typeof value === 'number' && value > maxNum ) {
        const error = new Error(`${fieldName} must be under ${maxNum}`)
        error.status = 400
        throw error
    }
    return value
}

export const validateDate = (dateStr, fieldName = "date") => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    const error = new Error(`${fieldName} is not a valid date`);
    error.status = 400;
    throw error;
  }
  return date;
};

