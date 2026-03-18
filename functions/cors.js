/**
 * CORS Utilities Module
 * Centralized CORS middleware and wrappers for all HTTP endpoints
 */

const cors = require('cors')({ origin: true });

/**
 * Global CORS wrapper for all HTTP endpoints
 */
function withCors(handler) {
    return (req, res) => {
        return cors(req, res, async () => {
            const origin = req.headers.origin || '*';
            res.set('Access-Control-Allow-Origin', origin);
            res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
            res.set('Access-Control-Allow-Credentials', 'false');
            res.set('Access-Control-Max-Age', '3600');

            if (req.method === 'OPTIONS') {
                return res.status(204).send('');
            }

            try {
                await handler(req, res);
            } catch (error) {
                console.error('HTTP Function Error:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
    };
}

/**
 * Wrapper for callable functions when using emulator
 */
function withCallableCors(handler) {
    return async (data, context) => {
        return await handler(data, context);
    };
}

/**
 * HTTP wrapper that delegates to callable function logic
 */
function createCallableHttpWrapper(callableHandler) {
    return withCors(async (req, res) => {
        try {
            const data = req.body.data || req.body || {};
            const idToken = req.headers.authorization?.split('Bearer ')[1];
            
            const context = {
                auth: null,
                rawRequest: req
            };
            
            if (idToken) {
                try {
                    const admin = require('firebase-admin');
                    const decodedToken = await admin.auth().verifyIdToken(idToken);
                    context.auth = {
                        uid: decodedToken.uid,
                        token: decodedToken
                    };
                } catch (error) {
                    console.error('Token verification failed:', error);
                }
            }
            
            const result = await callableHandler(data, context);
            return res.status(200).json({ result });
        } catch (error) {
            console.error('Callable HTTP wrapper error:', error);
            if (error.code === 'unauthenticated' || error.message?.includes('unauthenticated')) {
                return res.status(401).json({ error: { code: 'unauthenticated', message: error.message } });
            }
            return res.status(500).json({ error: { code: 'internal', message: error.message || 'Internal error' } });
        }
    });
}

module.exports = {
    withCors,
    withCallableCors,
    createCallableHttpWrapper,
    cors
};
