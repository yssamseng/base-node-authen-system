// src/core/response.js
import { appLogger } from '../utils/app-logger.util.js';
import { resCodeMessagesMapping, RES_CODE } from '../config/constants.js';
import moment from 'moment';

/** ---------- Helpers ---------- **/

/** ตัด 3 หลักหน้าเพื่อนำไปเป็น HTTP status (เช่น 20000 -> 200) */
const toHttpStatus = (code) => {
  const s = (code ?? '').toString();
  const n = Number.parseInt(s.slice(0, 3), 10);
  return Number.isFinite(n) ? n : 500;
};

/** ใช้ ISO string ที่มี ms โดยใช้ moment */
const nowIsoMs = () => moment().toISOString();

/** ดึง transactionId แบบปลอดภัย */
const getTxnId = (req) =>
  req?.headers?.['x-transaction-id'] ?? req?.get?.('x-transaction-id') ?? undefined;

/** ตรวจภาษา user จาก header (รองรับ th / en) */
const getLanguage = (req) => {
  const lang = req?.headers?.['x-language'];
  return ['th', 'en'].includes(lang) ? lang : 'th';
};

/** หา message object จาก resCodeMessagesMapping, ถ้าไม่มีใช้ INTERNAL_ERROR */
const resolveMessageObj = (_resCode) => resCodeMessagesMapping?.[_resCode] ?? resCodeMessagesMapping?.[RES_CODE.INTERNAL_ERROR] ?? { th: 'เกิดข้อผิดพลาด', en: 'Unexpected error' };

/** บันทึก responseObject ลง res สำหรับ trace/debug */
const attachResponseObject = (res, body) => {
  res.responseObject = {
    headers: res.getHeaders?.(),
    body,
    timestamp: nowIsoMs(),
  };
};

/** ---------- Public API (เดิม) ---------- **/

/**
 * ส่ง response ปกติ
 * @param {Request} req
 * @param {Response} res
 * @param {{ resCode: number|string, data?: any, [k:string]: any }} responseObj
 */
const response = (req, res, responseObj) => {
  const status = toHttpStatus(responseObj?.resCode);

  // log ก่อนส่ง
  appLogger.logResponse(req, res, responseObj, status);

  attachResponseObject(res, responseObj);
  return res.status(status).json(responseObj);
};

/**
 * ส่ง response เมื่อเกิด error
 * - ถ้ามี e.resCode จะ map เป็น HTTP status
 * - ถ้าไม่มี ใช้ 500xx และคืน userMessage จากตาราง resCodeMessagesMapping
 * @param {Request} req
 * @param {Response} res
 * @param {Error & {resCode?: number|string, error?: any}} e
 */
const responseError = (req, res, e = {}) => {
  const lang = getLanguage(req);
  const fallbackCode = RES_CODE.INTERNAL_ERROR;
  const useCode = e?.resCode ?? fallbackCode;
  const status = toHttpStatus(useCode);

  // log error
  appLogger.logResponseError(req, e, status);

  // ถ้า caller ป้อน e เป็น object พร้อมฟอร์แมตอยู่แล้ว ให้ส่งตามนั้น
  // แต่ถ้าไม่ได้อยู่ในรูปแบบมาตรฐาน ให้ normalize
  const body =
    e?.resCode
      ? e // เชื่อว่า caller จัดรูปไว้แล้ว (backward compatible)
      : genErrorResponseObj(req, useCode, e?.message ?? 'Unhandled error');

  // อัพเดท userMessage ให้ตรงกับภาษาที่ระบุ (กรณีใช้ fallback body)
  if (!e?.resCode && body?.error) {
    const msgObj = resolveMessageObj(useCode);
    body.error.userMessage = msgObj[lang] ?? msgObj.th ?? 'Error';
  }

  attachResponseObject(res, body);
  return res.status(status).json(body);
};

/** ---------- Object Builders ---------- **/
const genResponseObj = (req, _resCode, _data) => ({
  status: true,
  transactionId: getTxnId(req),
  resCode: _resCode,
  data: _data ?? {},
});

const genErrorResponseObj = (req, _resCode, _developerMessage) => {
  const lang = getLanguage(req);
  const messageObj = resolveMessageObj(_resCode);
  return {
    status: false,
    transactionId: getTxnId(req),
    resCode: _resCode,
    error: {
      developerMessage: _developerMessage,
      userMessage: messageObj[lang],
    },
  };
};

// for external service use
const genErrorServiceResponseObj = (req, _resCode, userMessage, _developerMessage) => ({
  status: false,
  transactionId: getTxnId(req),
  resCode: _resCode,
  error: {
    developerMessage: _developerMessage,
    userMessage,
  },
});

export {
  response,
  responseError,
  genResponseObj,
  genErrorResponseObj,
  genErrorServiceResponseObj,
};
