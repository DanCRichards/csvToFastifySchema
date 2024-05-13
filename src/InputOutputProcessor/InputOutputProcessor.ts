import {DefaultSchemaObject, InputMapping, SchemaObject} from "../types/types";
import {Stack} from "../utils/Stack";
import {csvMapping} from "../main";


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
    isRoot: boolean,
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
    public cursorPositionStack = new Stack<StackObject>();


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
                this.currentState = ProcessingState.OUTPUT;
                this.rowCounter = 0;
                continue;
            }
            this.rowCounter++;
            if (this.rowCounter < 2){
                continue;
            }

            if(this.results[i][this.mapping.dataType] == '' || this.results[i][this.mapping.dataType] == '\n' || this.results[i][this.mapping.dataType] == undefined){
                continue;
            }

            if(this.results[1][0] == 'TMS OWN Stored Proc Field'){
                continue;
            }


            switch(this.currentState){
                case ProcessingState.INPUT:
                    this.processRow(this.results[i], this.inputSpec, this.inputMandatoryFields, i, this.currentState);
                    break;
                case ProcessingState.OUTPUT:
                    this.processRow(this.results[i], this.outputSpec, this.outputMandatoryFields, i, this.currentState);
                    break;
                default:
                    continue;
            }
        }

        this.inputSpec['required'] = [...this.inputMandatoryFields];
        this.outputSpec['required'] = [...this.outputMandatoryFields];
    }

    /**
     * Traverse the cursor through the stack to the correct position
     * @param cursor
     */
    traverseCursorThroughStack(cursor: any): any{
        for(let i = 0; i < this.cursorPositionStack.getStack().length; i++){
            if(i == 0) continue;
            const parentStackItem = this.cursorPositionStack.getStack()[i-1];
            switch(parentStackItem.Type){
                case 'array':
                    if(parentStackItem.isRoot){
                        cursor = cursor.items;
                    } else{
                        cursor = cursor[parentStackItem.FieldName].items;
                    }
                    break;
                case "object":
                    if(parentStackItem.isRoot){
                        cursor = cursor.properties;
                    } else{
                        cursor = cursor[parentStackItem.FieldName].properties;
                    }
                    break;
            }
        }
        return cursor;
    }

    insertObjectAtCursorPosition(cursor: any, fieldName: string, insertObject: any){
        let objectToInsert = insertObject;

        // If the field name is empty, then we don't need to insert the field name
        if (fieldName.trim() != ''){
            objectToInsert = {[`${fieldName}`]:insertObject};
        }

        const topStackItem = this.cursorPositionStack.peek();
        switch(topStackItem!.Type){
            case 'array':
                if(topStackItem!.isRoot){
                    Object.assign(cursor.items, objectToInsert);
                } else {
                    Object.assign(cursor[topStackItem!.FieldName].items, objectToInsert);
                }
                break;
            case 'object':
                if(topStackItem!.isRoot){
                    Object.assign(cursor.properties, objectToInsert);
                } else {
                    Object.assign(cursor[topStackItem!.FieldName].properties, objectToInsert);
                }
                break;
        }
        return cursor;
    }

   public initialiseCursorPositionStack(){
       this.cursorPositionStack.push({
           Type: 'object',
           isRoot: true,
           FieldName: 'root',
       });
   }

   public shouldRepositionCursorPointerStack(lastParentField: string){
       return this.cursorPositionStack.peek()?.FieldName != lastParentField.trim() && this.cursorPositionStack.size() > 1
   }

   public repositionCursorPointerStack(lastParentField: string){
       while(this.cursorPositionStack.peek()?.FieldName != lastParentField && this.cursorPositionStack.size() != 0){
           this.cursorPositionStack.pop();
       }
   }

    insertRowIntoSpecification(row: string[], specification: SchemaObject, inputObject: any, log = false){
        const fieldName = row[this.mapping.fieldName];
        const dataType = row[this.mapping.dataType]
        const rootFieldName = 'root';
        const parentField = row[this.mapping.apiParentField] == '' ? rootFieldName : row[this.mapping.apiParentField];

        const parentFields = parentField.split(',');
        const lastParentField = parentFields[parentFields.length - 1];

        if (this.cursorPositionStack.isEmpty()){
            this.initialiseCursorPositionStack();
        }

        if(this.shouldRepositionCursorPointerStack(lastParentField)){
            this.repositionCursorPointerStack(lastParentField);
        }

        let cursor = specification;
        cursor = this.traverseCursorThroughStack(cursor);
        this.insertObjectAtCursorPosition(cursor, fieldName, inputObject);


        if(['array','object'].includes(dataType.toLowerCase())){
            this.cursorPositionStack.push({
                Type: dataType.toLowerCase() as StackObjectType,
                FieldName: fieldName,
                isRoot: false,
            })
        }
    }

    private getRowObject(type: string, row: string[], currentState: ProcessingState, specification: any){
        const size = row[this.mapping.size].split(','); // Will be one item if there is no ','
        const parsedSize = parseInt(size[0])

        // Parse a number of size 10 as an integer
        if(type.toLowerCase() == 'number' && parsedSize == 10){
            type = 'integer'
        }

        switch (type.toLowerCase()){
            case 'array':
                return {
                    type: 'array',
                    title: `${currentState === ProcessingState.INPUT ? 'BUSINESS_INPUTS.' : ''}${row[this.mapping.title]}`,
                    description: row[this.mapping.description],
                    items: {}
                };
            case 'object':
                return {
                    type: 'object',
                    title: `${currentState === ProcessingState.INPUT ? 'BUSINESS_INPUTS.' : ''}${row[this.mapping.title]}`,
                    description: row[this.mapping.description],
                    properties: {}
                };
            case 'string':
                return {
                    title: `${currentState === ProcessingState.INPUT ? 'BUSINESS_INPUTS.' : ''}${row[this.mapping.title]}`,
                    description: row[this.mapping.description],
                    type: type,
                    maxLength: parsedSize
                };
            case 'number':
            case 'integer':
                return {
                    title: `${currentState === ProcessingState.INPUT ? 'BUSINESS_INPUTS.' : ''}${row[this.mapping.title]}`,
                    description: row[this.mapping.description],
                    type: type,
                    maximum: `maxByDigits(${parsedSize})`
                };
            case 'boolean':
                return {
                    title: `${currentState === ProcessingState.INPUT ? 'BUSINESS_INPUTS.' : ''}${row[this.mapping.title]}`,
                    description: row[this.mapping.description],
                    type: type,
                    examples: [true, false]
                };
            case 'date':
                return {
                    title: `${currentState === ProcessingState.INPUT ? 'BUSINESS_INPUTS.' : ''}${row[this.mapping.title]}`,
                    description: row[this.mapping.description],
                    type: 'string',
                    format:'date',
                };

            case 'datetime':
                return {
                    title: `${currentState === ProcessingState.INPUT ? 'BUSINESS_INPUTS.' : ''}${row[this.mapping.title]}`,
                    description: row[this.mapping.description],
                    type: 'string',
                    format:'date-time',
                };
        }


    }

    private processRow(row: string[], specification: any , mandatoryFields: string[], i: number, currentState: ProcessingState) {
        const type = row[this.mapping.dataType].toLowerCase();
        const size = row[this.mapping.size];

        const insertObject = this.getRowObject(type, row, currentState, specification);
        this.insertRowIntoSpecification(row, specification, insertObject);

        if(size === ''){
            return;
        }

    }
}