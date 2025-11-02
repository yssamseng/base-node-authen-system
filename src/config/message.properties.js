export const resMessage = {
    common: {
        success: {
            en: 'Successful with data.',
            th: 'ทำรายการสำเร็จ',
        },
        successNoData: {
            en: 'Successful without data.',
            th: 'ทำรายการสำเร็จ',
        },
        error: {
            en: 'Sorry, The system is not available at this time.',
            th: 'ขออภัย ระบบไม่สามารถให้บริการได้ในขณะนี้',
        },
        pleaseTryAgain: {
            en: 'Sorry, the system cannot process the transaction. Please try again.',
            th: 'ระบบไม่สามารถทำรายการได้ กรุณาลองใหม่อีกครั้ง',
        },
        configNotFound: {
            en: 'Sorry, The system is not available because config is missing.',
            th: 'ขออภัย ระบบไม่สามารถใช้งานได้ เนื่องจากไม่พบ Config ในระบบ',
        },
    },
    file: {
        fileTypeInvalid: {
            en: 'Invalid File Type',
            th: 'ข้อมูลชนิดของ File ไม่ถูกต้อง',
        },
        notFound: {
            en: 'File Missing / Not found. please contact admin.',
            th: 'ไม่พบไฟล์ที่คุณร้องขอ กรุณาติดต่อ ผู้ดูแลระบบ',
        },
    },
    badRequest: {
        maxFileSize: {
            en: 'Can not do the transaction Because the image file is too large for the specified size',
            th: 'ไม่สามารถทำรายการได้ เนื่องจากไฟล์ภาพขนาดใหญ่เกินที่กำหนดไว้'
        },
        invalidParameter: {
            en: 'Invalid format of parameter',
            th: 'ข้อมูลที่กรอกไม่ถูกต้อง',
        },
        parameterIsMissing: {
            en: 'Missing parameter',
            th: 'ข้อมูลที่กรอกไม่ถูกต้อง',
        },
        duplicate: {
            en: 'Duplicate data',
            th: 'ข้อมูลซ้ำกับในระบบ',
        },
    },
    unauthorized: {
        loginWithWrongUserOrPassword: {
            en: 'Username or password incorrect, please try again',
            th: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง',
        },
        anotherSessionStillLogon: {
            en: 'Cannot access because there is another session still logon',
            th: 'ท่านไม่สามารถเข้าใช้งานได้ เนื่องจากมีผู้ใช้งานอีกท่านในระบบ',
        },
        userLockedTime: {
            en: 'Your account has been locked. Please wait a moment or contact admin',
            th: 'บัญชีของคุณถูกล็อค กรุณารอสักครู่ หรือติดต่อผู้ดูแลระบบ',
        },
    },
    forbidden: {
        sessionExpired: {
            en: 'Session expired, please log in again',
            th: 'เปิดหน้าจอค้างนานเกินระยะเวลาที่กำหนด กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
        },
        accessTokenInvalid: {
            en: 'Access token invalid, please log in again',
            th: 'ไม่สามารถหา token ของท่านได้ กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
        },
        forceUpdate: {
            en: 'Please update the application before use',
            th: 'กรุณาอัพเดทแอปพลิเคชันก่อนการใช้งาน',
        },
        sessionRevoked: {
            en: 'Your session has been revoked. Please log in again',
            th: 'การใช้งานของท่านถูกยกเลิกแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
        },
        roleNotMatchService: {
            en: 'You do not have access to use. Please contact the system administrator and log in again.',
            th: 'ท่านไม่มีสิทธิ์เข้าใช้งาน กรุณาติดต่อผู้ดูแลระบบ และเข้าสู่ระบบใหม่อีกครั้ง',
        },
    },
    notFound: {
        urlNotFound: {
            en: 'Your URL path is incorrect. Please contact the system administrator',
            th: 'ไม่พบบริการที่คุณร้องขอ กรุณาติดต่อผู้ดูแลระบบ',
        },
        dataNotFound: {
            en: 'Data not found',
            th: 'ไม่พบข้อมูล',
        },
        userNotFound: {
            en: 'User not found',
            th: 'ไม่พบผู้ใช้งาน',
        },
    },
    auth: {
        registrationSuccess: {
            en: 'User registered successfully',
            th: 'ลงทะเบียนผู้ใช้งานสำเร็จ',
        },
        loginSuccess: {
            en: 'Login successful',
            th: 'เข้าสู่ระบบสำเร็จ',
        },
        logoutSuccess: {
            en: 'Logout successful',
            th: 'ออกจากระบบสำเร็จ',
        },
        profileUpdated: {
            en: 'Profile updated successfully',
            th: 'อัพเดทข้อมูลส่วนตัวสำเร็จ',
        },
        emailAlreadyExists: {
            en: 'User with this email already exists',
            th: 'อีเมลนี้มีผู้ใช้งานแล้ว',
        },
        usernameAlreadyExists: {
            en: 'Username is already taken',
            th: 'ชื่อผู้ใช้งานนี้ถูกใช้งานแล้ว',
        },
        invalidCredentials: {
            en: 'Invalid email or password',
            th: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        },
        accountDeactivated: {
            en: 'Your account has been deactivated',
            th: 'บัญชีของคุณถูกระงับการใช้งาน',
        },
        accountLocked: {
            en: 'Account is locked. Please try again later',
            th: 'บัญชีถูกล็อค กรุณาลองใหม่ภายหลัง',
        },
        authenticationRequired: {
            en: 'Authentication token required',
            th: 'ต้องการ token ในการยืนยันตัวตน',
        },
        tokenInvalid: {
            en: 'Invalid authentication token',
            th: 'token ไม่ถูกต้อง',
        },
        tokenExpired: {
            en: 'Authentication token expired',
            th: 'token หมดอายุ',
        },
        authDataNotFound: {
            en: 'Authentication data not found',
            th: 'ไม่พบข้อมูลการยืนยันตัวตน',
        },
    },
};
