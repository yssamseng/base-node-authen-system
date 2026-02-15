/**
 * Multi-language response messages (English and Thai)
 * @module config/message.properties
 */

export const resMessage = {
  // ============================
  // COMMON (200 + 500)
  // ============================
  common: {
    success: {
      en: "Successful with data.",
      th: "ทำรายการสำเร็จ",
    },
    successNoData: {
      en: "Successful without data.",
      th: "ทำรายการสำเร็จ",
    },

    // 500 Internal Server Error
    error: {
      en: "Sorry, The system is not available at this time.",
      th: "ขออภัย ระบบไม่สามารถให้บริการได้ในขณะนี้",
    },
    pleaseTryAgain: {
      en: "Sorry, the system cannot process the transaction. Please try again.",
      th: "ระบบไม่สามารถทำรายการได้ กรุณาลองใหม่อีกครั้ง",
    },
    configNotFound: {
      en: "Sorry, The system is not available because config is missing.",
      th: "ขออภัย ระบบไม่สามารถใช้งานได้ เนื่องจากไม่พบ Config ในระบบ",
    },
  },

  // ============================
  // BAD REQUEST (400)
  // ============================
  badRequest: {
    invalidRequest: {
      en: "Invalid request",
      th: "คำขอไม่ถูกต้อง",
    },
    invalidParameter: {
      en: "Invalid format of parameter",
      th: "ข้อมูลที่กรอกไม่ถูกต้อง",
    },
    parameterIsMissing: {
      en: "Missing parameter",
      th: "ข้อมูลที่กรอกไม่ถูกต้อง",
    },
    duplicate: {
      en: "Duplicate data",
      th: "ข้อมูลซ้ำกับในระบบ",
    },
    maxFileSize: {
      en: "Cannot process because the image file is too large",
      th: "ไม่สามารถทำรายการได้ เนื่องจากไฟล์ภาพขนาดใหญ่เกินที่กำหนดไว้",
    },
  },

  // ============================
  // UNAUTHORIZED (401)
  // ============================
  unauthorized: {
    authenticationRequired: {
      en: "Authentication required",
      th: "ต้องเข้าสู่ระบบก่อนใช้งาน",
    },

    loginWithWrongUserOrPassword: {
      en: "Username or password incorrect, please try again",
      th: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง",
    },

    anotherSessionStillLogon: {
      en: "Cannot access because there is another session still logon",
      th: "ท่านไม่สามารถเข้าใช้งานได้ เนื่องจากมีผู้ใช้งานอีกท่านในระบบ",
    },

    userLockedTime: {
      en: "Your account has been locked. Please wait a moment or contact admin",
      th: "บัญชีของคุณถูกล็อค กรุณารอสักครู่ หรือติดต่อผู้ดูแลระบบ",
    },

    // Token problems (must be 401)
    tokenMissing: {
      en: "Authentication token is missing",
      th: "ไม่พบ token สำหรับยืนยันตัวตน",
    },
    tokenInvalid: {
      en: "Invalid authentication token",
      th: "token ไม่ถูกต้อง",
    },
    tokenExpired: {
      en: "Authentication token expired",
      th: "token หมดอายุ กรุณาเข้าสู่ระบบใหม่",
    },
    sessionExpired: {
      en: "Session has expired, please log in again",
      th: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่",
    },
  },

  // ============================
  // FORBIDDEN (403)
  // ============================
  forbidden: {
    forbidden: {
      en: "Access forbidden",
      th: "การเข้าถึงถูกปฏิเสธ",
    },

    accessTokenInvalid: {
      en: "Access token invalid, please log in again",
      th: "ไม่สามารถหา token ของท่านได้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
    },

    forceUpdate: {
      en: "Please update the application before use",
      th: "กรุณาอัพเดทแอปพลิเคชันก่อนการใช้งาน",
    },

    sessionRevoked: {
      en: "Your session has been revoked. Please log in again",
      th: "การใช้งานของท่านถูกยกเลิกแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้ง",
    },

    roleNotMatchService: {
      en: "You do not have access to use. Please contact the system administrator and log in again.",
      th: "ท่านไม่มีสิทธิ์เข้าใช้งาน กรุณาติดต่อผู้ดูแลระบบ และเข้าสู่ระบบใหม่อีกครั้ง",
    },
  },

  // ============================
  // NOT FOUND (404)
  // ============================
  notFound: {
    urlNotFound: {
      en: "Your URL path is incorrect. Please contact the system administrator",
      th: "ไม่พบบริการที่คุณร้องขอ กรุณาติดต่อผู้ดูแลระบบ",
    },
    dataNotFound: {
      en: "Data not found",
      th: "ไม่พบข้อมูล",
    },
    userNotFound: {
      en: "User not found",
      th: "ไม่พบผู้ใช้งาน",
    },
    fileNotFound: {
      en: "File not found",
      th: "ไม่พบไฟล์",
    },
  },

  // ============================
  // AUTH BUSINESS LOGIC (200 + 409)
  // ============================
  auth: {
    registrationSuccess: {
      en: "User registered successfully",
      th: "ลงทะเบียนผู้ใช้งานสำเร็จ",
    },
    loginSuccess: {
      en: "Login successful",
      th: "เข้าสู่ระบบสำเร็จ",
    },
    logoutSuccess: {
      en: "Logout successful",
      th: "ออกจากระบบสำเร็จ",
    },
    profileUpdated: {
      en: "Profile updated successfully",
      th: "อัพเดทข้อมูลส่วนตัวสำเร็จ",
    },

    emailAlreadyExists: {
      en: "User with this email already exists",
      th: "อีเมลนี้มีผู้ใช้งานแล้ว",
    },
    emailAlreadyVerified: {
      en: "Email has already been verified",
      th: "อีเมลนี้ได้รับการยืนยันแล้ว",
    },
    usernameAlreadyExists: {
      en: "Username is already taken",
      th: "ชื่อผู้ใช้งานนี้ถูกใช้งานแล้ว",
    },

    invalidCredentials: {
      en: "Invalid email or password",
      th: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    },

    accountDeactivated: {
      en: "Your account has been deactivated",
      th: "บัญชีของคุณถูกระงับการใช้งาน",
    },
    accountLocked: {
      en: "Account is locked. Please try again later",
      th: "บัญชีถูกล็อค กรุณาลองใหม่ภายหลัง",
    },

    authDataNotFound: {
      en: "Authentication data not found",
      th: "ไม่พบข้อมูลการยืนยันตัวตน",
    },

    passwordResetSuccess: {
      en: "Password has been reset successfully",
      th: "รีเซ็ตรหัสผ่านสำเร็จ",
    },
    passwordTooWeak: {
      en: "Password is too weak",
      th: "รหัสผ่านไม่ปลอดภัยเพียงพอ",
    },
  },

  // ============================
  // FILE MODULE
  // ============================
  file: {
    fileTypeInvalid: {
      en: "Invalid File Type",
      th: "ข้อมูลชนิดของ File ไม่ถูกต้อง",
    },
    notFound: {
      en: "File Missing / Not found. please contact admin.",
      th: "ไม่พบไฟล์ที่คุณร้องขอ กรุณาติดต่อ ผู้ดูแลระบบ",
    },
  },

  // ============================
  // FILE UPLOAD MODULE
  // ============================
  fileUpload: {
    fileUploadSuccess: {
      en: "File uploaded successfully",
      th: "อัปโหลดไฟล์สำเร็จ",
    },
    fileDownloadReady: {
      en: "File download ready",
      th: "ดาวน์โหลดไฟล์พร้อม",
    },
    fileDeleteSuccess: {
      en: "File deleted successfully",
      th: "ลบไฟล์สำเร็จ",
    },

    invalidFileType: {
      en: "Invalid file type",
      th: "ประเภทไฟล์ไม่ถูกต้อง",
    },
    fileTooLarge: {
      en: "File too large (max 10MB)",
      th: "ไฟล์ใหญ่เกินไป (สูงสุด 10MB)",
    },

    quotaExceeded: {
      en: "User storage quota exceeded",
      th: "เกินโควต้าพื้นที่จัดเก็บ",
    },
    invalidFilename: {
      en: "Filename contains invalid characters",
      th: "ชื่อไฟล์มีอักขระที่ไม่ถูกต้อง",
    },
    noFileProvided: {
      en: "No file provided",
      th: "ไม่ได้ระบุไฟล์",
    },

    accessDenied: {
      en: "No permission to access this file",
      th: "ไม่มีสิทธิ์เข้าถึงไฟล์นี้",
    },
  },
};
