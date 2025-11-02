import { AsyncLocalStorage } from 'node:async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

/**
 * ให้ค่า Correlation ID และ User ID (ถ้ามี) สำหรับ Request ปัจจุบัน
 * @param {object} store - ออบเจ็กต์ที่จะเก็บ (เช่น { correlation_id, user_id })
 * @param {Function} callback - ฟังก์ชันที่จะรัน (เช่น Express handler)
 */
export const runWithTrace = (store, callback) => {
  asyncLocalStorage.run(store, () => {
    callback();
  });
};

/**
 * ดึงค่า Store ของ Request ปัจจุบัน
 * @returns {object} - (เช่น { correlation_id, user_id })
 */
export const getStore = () => {
  return asyncLocalStorage.getStore();
};