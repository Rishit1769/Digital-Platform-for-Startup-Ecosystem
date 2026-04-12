"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db_1 = require("./db");
const minio_1 = require("./services/minio");
const errorHandler_1 = require("./middleware/errorHandler");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const profileRoutes_1 = __importDefault(require("./routes/profileRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const discoverRoutes_1 = __importDefault(require("./routes/discoverRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, morgan_1.default)('dev'));
// Routes
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is healthy' });
});
app.use('/api/auth', authRoutes_1.default);
app.use('/api/profile', profileRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/discover', discoverRoutes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
app.use('/api/ai', aiRoutes_1.default);
app.use('/api/dashboard', dashboardRoutes_1.default);
// Global Error Handler
app.use(errorHandler_1.errorHandler);
// Initialization & Server Start
const startServer = async () => {
    try {
        await (0, db_1.initializeDatabase)();
        await (0, minio_1.initializeMinio)();
        app.listen(port, () => {
            console.log(`Server is running at http://localhost:${port}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
