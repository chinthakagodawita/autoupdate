"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigLoader = void 0;
var ConfigLoader = /** @class */ (function () {
    function ConfigLoader() {
        this.env = process.env;
    }
    ConfigLoader.prototype.githubToken = function () {
        return this.getValue('GITHUB_TOKEN', true);
    };
    ConfigLoader.prototype.dryRun = function () {
        var val = this.getValue('DRY_RUN', false, 'false');
        return val === 'true';
    };
    ConfigLoader.prototype.pullRequestFilter = function () {
        // one of 'all', 'protected' or 'labelled'.
        return this.getValue('PR_FILTER', false, 'all');
    };
    ConfigLoader.prototype.pullRequestLabels = function () {
        var rawLabels = this.getValue('PR_LABELS', false, '').toString().trim();
        if (rawLabels === '') {
            return [];
        }
        return rawLabels.split(',').map(function (label) { return label.trim(); });
    };
    ConfigLoader.prototype.mergeMsg = function () {
        var msg = this.getValue('MERGE_MSG', false, '').toString().trim();
        return msg === '' ? null : msg;
    };
    ConfigLoader.prototype.conflictMsg = function () {
        var msg = this.getValue('CONFLICT_MSG', false, '').toString().trim();
        return msg === '' ? null : msg;
    };
    ConfigLoader.prototype.retryCount = function () {
        return parseInt(this.getValue('RETRY_COUNT', false, 5), 10);
    };
    ConfigLoader.prototype.retrySleep = function () {
        // In milliseconds.
        return parseInt(this.getValue('RETRY_SLEEP', false, 300), 10);
    };
    ConfigLoader.prototype.mergeConflictAction = function () {
        // one of 'fail' or 'ignore'.
        return this.getValue('MERGE_CONFLICT_ACTION', false, 'fail');
    };
    ConfigLoader.prototype.getValue = function (key, required, defaultVal) {
        if (required === void 0) { required = false; }
        if (key in this.env && this.env[key] !== null && this.env[key] !== void 0) {
            return this.env[key];
        }
        if (required) {
            throw new Error("Environment variable '" + key + "' was not provided, please define it and try again.");
        }
        return defaultVal;
    };
    return ConfigLoader;
}());
exports.ConfigLoader = ConfigLoader;
exports.default = new ConfigLoader();
