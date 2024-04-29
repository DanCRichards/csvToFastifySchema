import {DefaultSchemaObject, InputMapping, SchemaObject} from "../types/types";
import fs from "fs";

export class InputOutputProcessor {
    private processingInput: boolean = false;
    private rowCounter: number = 0;
    private inputSpec: SchemaObject = {...DefaultSchemaObject};
    private mandatoryFields: string[] = [];
    private readonly results: string[][];
    private readonly mapping: InputMapping;

    constructor(results: string[][], mapping: InputMapping) {
        this.results = results;
        this.mapping = mapping;
    }

    getInputSpec(): SchemaObject{
        return this.inputSpec;
    }

    processFile() {
        for(let i = 0; i < this.results.length; i++) {
            if( this.results[i]['0'] === '\nINPUTS' ) {
                this.processingInput = true;
                this.rowCounter = 0;
                continue;
            }
            if (this.results[i]['0'] === '\nOUTPUTS') {
                break;
            }
            if(this.results[i][this.mapping.fieldName] === '' ) {
                continue;
            }

            if(!this.processingInput){
                continue;
            }
            this.rowCounter++;

            if (this.rowCounter < 2){
                continue;
            }

            this.processRow(this.results[i], this.inputSpec, this.mandatoryFields, i);
        }

        this.inputSpec['required'] = [...this.mandatoryFields];
    }

    private processRow(row: string[], specification: any , mandatoryFields: string[], i: number) {
        const type = row[this.mapping.dataType].toLowerCase();
        const size = row[this.mapping.size];

        if(type.includes('array')){
            const fieldName = row[this.mapping.fieldName].split('[')[0];
            const subType = type.split('[')[1].split(']')[0];
            specification.properties[fieldName] = {
                type: 'array',
                items:{
                    title: `BUSINESS_INPUTS.${row[this.mapping.title]}`,
                    description: row[this.mapping.description],
                    type: subType.toLowerCase(),
                }
            }
        } else{
            specification.properties[row[this.mapping.fieldName]] = {
                title: `BUSINESS_INPUTS.${row[this.mapping.title]}`,
                description: row[this.mapping.description],
                type: type,
            }

            if (row[this.mapping.exampleData] !== ''){
                specification.properties[row[this.mapping.fieldName]]['examples'] = [row[this.mapping.exampleData]]
            }

            if(row[this.mapping.mandatory] === 'Y') {
                mandatoryFields.push(row[this.mapping.fieldName]);
            }
        }

        if(size === ''){
            return;
        }

        switch(type) {
            case 'string':
                try{
                    specification.properties[row[this.mapping.fieldName]]['maxLength'] = parseInt(size);
                }
                catch (e) {
                    throw new Error(`Error processing row ${i}. Cannot pass size as int. apiFieldName: ${row[this.mapping.fieldName]}`);
                }
                break;
            case 'number':
            case 'integer':
                if(size.includes(',')){
                    break;
                }
                specification.properties[row[this.mapping.fieldName]]['maximum'] = `maxByDigits(${row[this.mapping.size]})`;
                break;
            case 'boolean':
                specification.properties[row[this.mapping.fieldName]]['examples'] = [true, false];
                break;
            default:
                break;
        }
    }
}