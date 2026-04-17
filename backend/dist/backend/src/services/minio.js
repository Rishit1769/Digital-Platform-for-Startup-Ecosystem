"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildObjectUrl = exports.initializeMinio = exports.minioClient = void 0;
const Minio = __importStar(require("minio"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});
const initializeMinio = async () => {
    const bucketName = process.env.MINIO_BUCKET || 'cloudcampus-bucket';
    try {
        const exists = await exports.minioClient.bucketExists(bucketName);
        if (!exists) {
            await exports.minioClient.makeBucket(bucketName, 'us-east-1');
            console.log(`Bucket ${bucketName} created successfully in default region.`);
        }
        else {
            console.log(`Bucket ${bucketName} already exists.`);
        }
    }
    catch (err) {
        console.error('Error initializing MinIO:', err);
        process.exit(1);
    }
};
exports.initializeMinio = initializeMinio;
const buildObjectUrl = (bucketName, objectName) => {
    const cdnBase = process.env.MINIO_CDN_BASE_URL;
    const publicBase = process.env.MINIO_PUBLIC_BASE_URL;
    if (cdnBase && cdnBase.trim()) {
        const base = cdnBase.replace(/\/$/, '');
        return `${base}/${encodeURI(objectName)}`;
    }
    if (publicBase && publicBase.trim()) {
        const base = publicBase.replace(/\/$/, '');
        return `${base}/${bucketName}/${encodeURI(objectName)}`;
    }
    const endpoint = process.env.MINIO_ENDPOINT || '127.0.0.1';
    const port = process.env.MINIO_PORT || '9000';
    return `http://${endpoint}:${port}/${bucketName}/${encodeURI(objectName)}`;
};
exports.buildObjectUrl = buildObjectUrl;
