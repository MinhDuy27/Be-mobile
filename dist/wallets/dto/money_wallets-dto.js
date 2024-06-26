"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.money_wallets = void 0;
const swagger_1 = require("@nestjs/swagger");
class money_wallets {
}
exports.money_wallets = money_wallets;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'user email',
        example: 'Magnus.Wiza@yahoo.com'
    }),
    __metadata("design:type", String)
], money_wallets.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'amout of money want to do',
        example: '2000'
    }),
    __metadata("design:type", Number)
], money_wallets.prototype, "money", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'vi nuoc hoa'
    }),
    __metadata("design:type", String)
], money_wallets.prototype, "wallets_name", void 0);
//# sourceMappingURL=money_wallets-dto.js.map