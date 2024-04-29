export type SchemaObject = any;
export const DefaultSchemaObject: SchemaObject = {
    type: 'object',
    description: '',
    properties: {}
};


export type InputFileSchema = string[][];



export type InputMapping = {
    fieldName: number,
    title: number,
    mandatory: number,
    dataType: number,
    size: number,
    exampleData: number,
    description: number,
}