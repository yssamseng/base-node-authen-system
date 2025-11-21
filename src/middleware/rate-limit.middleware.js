const rateLimit = (options = {}) => {
    const {
        windowMs = 15 * 60 * 1000, // 15 minutes
        maxAttempts = 5,
        message = 'Too many authentication attempts, please try again later',
        skipSuccessfulRequests = true,
        keyGenerator = (req) => `${req.ip}:${req.path}`,
    } = options;

    const attempts = new Map();

    return (req, res, next) => {
        const key = keyGenerator(req);
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean up old attempts for this key
        if (attempts.has(key)) {
            const filtered = attempts.get(key).filter(time => time > windowStart);
            if (filtered.length === 0) {
                attempts.delete(key);
            } else {
                attempts.set(key, filtered);
            }
        }

        // Check limit
        const userAttempts = attempts.get(key) || [];
        if (userAttempts.length >= maxAttempts) {
            logger.warn('Authentication rate limit exceeded', {
                ip: req.ip,
                path: req.path,
                attempts: userAttempts.length,
                windowMs,
            });

            const error = new AppError(RESPONSE_CODES.TOO_MANY_REQUESTS, message);
            return next(error);
        }

        // Add current attempt
        const attemptTime = now;
        userAttempts.push(attemptTime);
        attempts.set(key, userAttempts);

        if (skipSuccessfulRequests) {
            res.on('finish', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const currentAttempts = (attempts.get(key) || []).filter(
                        t => t !== attemptTime
                    );
                    if (currentAttempts.length === 0) {
                        attempts.delete(key);
                    } else {
                        attempts.set(key, currentAttempts);
                    }
                }
            });
        }

        next();
    };
};

export { rateLimit };