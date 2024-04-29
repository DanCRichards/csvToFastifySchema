import {DefaultSchemaObject, InputMapping, SchemaObject} from "../types/types";


enum ProcessingState {
    HEADER,
    INPUT,
    OUTPUT
}

function deepCopy(obj: any) {
    return JSON.parse(JSON.stringify(obj));
}

export class InputOutputProcessor {
    private rowCounter: number = 0;
    private inputSpec: SchemaObject = deepCopy(DefaultSchemaObject);
    private outputSpec: SchemaObject = deepCopy(DefaultSchemaObject);
    private inputMandatoryFields: string[] = [];
    private outputMandatoryFields: string[] = [];
    private readonly results: string[][];
    private readonly mapping: InputMapping;
    private currentState: ProcessingState = ProcessingState.HEADER;


    constructor(results: string[][], mapping: InputMapping) {
        this.results = results;
        this.mapping = mapping;
    }

    getInputSpec(): SchemaObject{
        return this.inputSpec;
    }

    getOutputSpec(): SchemaObject{
        return this.outputSpec;
    }

    processFile() {
        for(let i = 0; i < this.results.length; i++) {
            if( this.results[i]['0'] === '\nINPUTS' ) {
                this.currentState = ProcessingState.INPUT;
                this.rowCounter = 0;
                continue;
            }
            if (this.results[i]['0'] === '\nOUTPUTS') {
                console.log(this.inputSpec);
                this.currentState = ProcessingState.OUTPUT;
                this.rowCounter = 0;
                continue;
            }
            if (this.results[i][0] === '\n' || this.results[i][this.mapping.dataType] === ''){
                this.currentState = ProcessingState.HEADER;
                continue;
            }
            if(this.results[i][this.mapping.fieldName] === '' ) {
                continue;
            }
            this.rowCounter++;
            if (this.rowCounter < 2){
                continue;
            }
            switch(this.currentState){
                case ProcessingState.INPUT:
                    this.processRow(this.results[i], this.inputSpec, this.inputMandatoryFields, i, this.currentState);
                    break;
                case ProcessingState.OUTPUT:
                    this.processRow(this.results[i], this.outputSpec, this.outputMandatoryFields, i, this.currentState);
                    break;
            }
        }

        this.inputSpec['required'] = [...this.inputMandatoryFields];
        this.outputSpec['required'] = [...this.outputMandatoryFields];
    }

    private processRow(row: string[], specification: any , mandatoryFields: string[], i: number, currentState: ProcessingState) {
        const type = row[this.mapping.dataType].toLowerCase();
        const size = row[this.mapping.size];

        if(type.includes('array')){
            const fieldName = row[this.mapping.fieldName].split('[')[0];
            const subType = type.split('[')[1].split(']')[0];
            specification.properties[fieldName] = {
                type: 'array',
                items:{
                    title: `${currentState === ProcessingState.INPUT ? 'BUSINESS_INPUTS.':''}${row[this.mapping.title]}`,
                    description: row[this.mapping.description],
                    type: subType.toLowerCase(),
                }
            }
        } else{
            specification.properties[row[this.mapping.fieldName]] = {
                title: `${currentState === ProcessingState.INPUT ? 'BUSINESS_INPUTS.':''}${row[this.mapping.title]}`,
                description: row[this.mapping.description],
                type: type,
            }

            if (row[this.mapping.exampleData] !== ''){
                const examples = row[this.mapping.exampleData].split(',').map((example: string) => example.trim());
                specification.properties[row[this.mapping.fieldName]]['examples'] = examples;
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