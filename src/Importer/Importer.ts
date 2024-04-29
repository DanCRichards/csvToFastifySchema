import { InputFileSchema } from "../types/types";
import * as fs from 'fs';
import csv from 'csv-parser';

export class Importer {
    fileName = '';
    results: InputFileSchema = [];

    constructor(_fileName: string) {
        this.fileName = _fileName;
    }

    async processFile() {
        const fileStream = fs.createReadStream(this.fileName);

        return new Promise<void>((resolve, reject) => {
            fileStream
                .pipe(csv({ newline: '\r\n', headers: false }))
                .on('data', this.processRow.bind(this))
                .on('end', () => {
                    resolve();
                })
                .on('error', (err: Error) => {
                    this.handleError(err);
                    reject(err);
                });
        });
    }

	getResults() {
		return this.results;
	}

    private processRow(data: string[]) {
        this.results.push(data);
    }

    private handleError(err: Error) {
        console.error('An error occurred:', err);
    }

}