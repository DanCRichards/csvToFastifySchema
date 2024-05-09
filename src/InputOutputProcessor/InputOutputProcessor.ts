import {DefaultSchemaObject, InputMapping, SchemaObject} from "../types/types";
import {Stack} from "../utils/Stack";


enum ProcessingState {
    HEADER = 'HEADER',
    INPUT = 'INPUT',
    OUTPUT = 'OUTPUT'
}

function deepCopy(obj: any) {
    return JSON.parse(JSON.stringify(obj));
}

export type StackObjectType = 'array' | 'object';

export interface StackObject {
    Type: StackObjectType,
    FieldName: string
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
    public stack = new Stack<StackObject>();


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

    appendField(row: string[], specification: SchemaObject, inputObject: any, log = false){

        const fieldName = row[this.mapping.fieldName];
        const dataType = row[this.mapping.dataType]
        const parentFields = row[this.mapping.apiParentField];

        const parentFieldsExpanded = parentFields.split(',');

        const atRootLevel = this.stack.size() == 0;

        if(['array','object'].includes(dataType.toLowerCase())){
            this.stack.push({
                Type: dataType.toLowerCase() as StackObjectType,
                FieldName: fieldName
            })
        }

       if(atRootLevel){
            specification.properties[fieldName] = inputObject;
            return;
        }

       // Assuming that the response will always be an object. Change this + change the stack implementation if we will return an array
        let cursor = specification.properties;

       let parentObjectType: StackObjectType = 'object'
       // Traverse the Children Object
        for (let i = 0; i < this.stack.size(); i++){
            const stackItem = this.stack.getStack()[i];
            switch(stackItem.Type){
                case 'array':
                    cursor = cursor[`${stackItem.FieldName}`].items
                    parentObjectType = 'array';
                    break;
                case 'object':
                    cursor = cursor[`${stackItem.FieldName}`].properties
                    parentObjectType = 'object';
                    break;
            }
        }

        // At the child leaf of the object / value
        // Change the specific point of cursor
        switch(parentObjectType){
            case 'array':
                // Unsure what to do here...
                if(['array','object'].includes(dataType.toLowerCase())){
                    cursor[fieldName] = inputObject
                } else {
                    Object.assign(cursor, inputObject)
                }
                break;
            case 'object':
                cursor[fieldName] = inputObject
                break;
        }
    }


    private processRow(row: string[], specification: any , mandatoryFields: string[], i: number, currentState: ProcessingState) {
        const type = row[this.mapping.dataType].toLowerCase();
        const size = row[this.mapping.size];
        const fieldName = row[this.mapping.fieldName];

        switch (type.toLowerCase()){
            case 'array':
                const arrayField = {
                    type: 'array',
                        title: `${currentState === ProcessingState.INPUT ? 'BUSINESS_INPUTS.':''}${row[this.mapping.title]}`,
                        description: row[this.mapping.description],
                        items:{
                        }
                }
                this.appendField(row, specification, arrayField)
                break;
            case 'object':
                const field = {
                    type: 'object',
                    title: `${currentState === ProcessingState.INPUT ? 'BUSINESS_INPUTS.':''}${row[this.mapping.title]}`,
                    description: row[this.mapping.description],
                    properties:{
                    }
                }
                this.appendField(row, specification, field)
                break;
            default:
                const defaultField = {
                    title: `${currentState === ProcessingState.INPUT ? 'BUSINESS_INPUTS.':''}${row[this.mapping.title]}`,
                    description: row[this.mapping.description],
                    type: type,
                }

                this.appendField(row, specification, defaultField);

                break;
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