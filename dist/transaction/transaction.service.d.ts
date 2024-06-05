/// <reference types="mongoose/types/aggregate" />
/// <reference types="mongoose/types/callback" />
/// <reference types="mongoose/types/collection" />
/// <reference types="mongoose/types/connection" />
/// <reference types="mongoose/types/cursor" />
/// <reference types="mongoose/types/document" />
/// <reference types="mongoose/types/error" />
/// <reference types="mongoose/types/expressions" />
/// <reference types="mongoose/types/helpers" />
/// <reference types="mongoose/types/middlewares" />
/// <reference types="mongoose/types/indexes" />
/// <reference types="mongoose/types/models" />
/// <reference types="mongoose/types/mongooseoptions" />
/// <reference types="mongoose/types/pipelinestage" />
/// <reference types="mongoose/types/populate" />
/// <reference types="mongoose/types/query" />
/// <reference types="mongoose/types/schemaoptions" />
/// <reference types="mongoose/types/schematypes" />
/// <reference types="mongoose/types/session" />
/// <reference types="mongoose/types/types" />
/// <reference types="mongoose/types/utility" />
/// <reference types="mongoose/types/validation" />
/// <reference types="mongoose/types/virtuals" />
/// <reference types="mongoose/types/inferschematype" />
import { transactions } from './schema/transaction.schema';
import * as mongoose from 'mongoose';
import { Query } from 'express-serve-static-core';
import { wallets } from '../wallets/schema/wallets-schema';
import { budget } from '../budget/schema/budget.schema';
import { createTransactionDTO } from './dto/createTransactionDTO';
import { modifyTransactionDTO } from './dto/modifyTransactionDTO';
import { deleteTransactionDTO } from './dto/deleteTransactionDTO';
export declare class TransactionService {
    private transactionsModel;
    private walletsModel;
    private budgetModels;
    constructor(transactionsModel: mongoose.Model<transactions>, walletsModel: mongoose.Model<wallets>, budgetModels: mongoose.Model<budget>);
    create(transactions: createTransactionDTO): Promise<mongoose.Document<unknown, {}, transactions> & transactions & {
        _id: mongoose.Types.ObjectId;
    }>;
    histories(query: Query): Promise<(mongoose.Document<unknown, {}, transactions> & transactions & {
        _id: mongoose.Types.ObjectId;
    })[]>;
    Allhistories(query: Query): Promise<any[]>;
    delete(transaction: deleteTransactionDTO): Promise<mongoose.Document<unknown, {}, transactions> & transactions & {
        _id: mongoose.Types.ObjectId;
    }>;
    modify(transaction: modifyTransactionDTO): Promise<mongoose.Document<unknown, {}, transactions> & transactions & {
        _id: mongoose.Types.ObjectId;
    }>;
}
