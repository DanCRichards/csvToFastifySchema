import {InputOutputProcessor, StackObject} from './InputOutputProcessor';
import { DefaultSchemaObject, InputMapping, SchemaObject } from "../types/types";
import {Stack} from "../utils/Stack";
import {csvMapping} from "../main";

describe('InputOutputProcessor', () => {
    let processor: InputOutputProcessor;
    let results: string[][];
    let mapping: InputMapping;

    beforeEach(() => {
        // Initialize your results and mapping here
        results = [];
        mapping = {
            apiParentField: 6,
            fieldName: 7,
            title: 1,
            mandatory: 2,
            dataType: 3,
            size: 4,
            exampleData: 5,
            description: 8,
        };
        processor = new InputOutputProcessor(results, mapping);
        processor.stack.clear();
    });

    test('should initialize correctly', () => {
        expect(processor).toBeInstanceOf(InputOutputProcessor);
    });

    test('getInputSpec should return a deep copy of DefaultSchemaObject', () => {
        const inputSpec: SchemaObject = processor.getInputSpec();
        expect(inputSpec).toEqual(DefaultSchemaObject);
        expect(inputSpec).not.toBe(DefaultSchemaObject); // Ensure it's a deep copy
    });

    test('getOutputSpec should return a deep copy of DefaultSchemaObject', () => {
        const outputSpec: SchemaObject = processor.getOutputSpec();
        expect(outputSpec).toEqual(DefaultSchemaObject);
        expect(outputSpec).not.toBe(DefaultSchemaObject); // Ensure it's a deep copy
    });

    test('setField - Can set normal field at root level', () => {
        const row = ['milestone_code_chr', 'MILESTONE_CODE', 'Y', 'String', '20', '', '', 'milestoneCode', 'Allocated code for the milestone'];
        const specification = structuredClone(DefaultSchemaObject);
        const inputObject = {
            title: 'BUSINESS_INPUTS.MILESTONE_CODE',
            description: 'Allocated code for the milestone',
            type: 'string',
            };
        processor.appendField(row, specification, inputObject);

        expect(specification).toEqual({
            type: 'object',
            description: '',
            properties: {
                milestoneCode: {
                    title: 'BUSINESS_INPUTS.MILESTONE_CODE',
                    description: 'Allocated code for the milestone',
                    type: 'string',
                }
            }
        });
    });

    test('setField - Can set multiple normal fields at root level', () => {
        const rows = [
            {
                row: ['dest_rl_id_col', 'DESTINATION_ID', 'Y', 'Number', '10', '', '', 'id', 'The id of the impacted service'],
                inputObject: {
                    title: 'BUSINESS_INPUTS.DESTINATION_ID',
                    description: 'The id of the impacted service',
                    type: 'number'
                }
            },
            {
                row: ['dest_rl_code_col', 'DESTINATION_CODE', 'Y', 'String', '12', '', '', 'code', 'The code of the impacted service'],
                inputObject: {
                    title: 'BUSINESS_INPUTS.DESTINATION_CODE',
                    description: 'The code of the impacted service',
                    type: 'string'
                }
            }
        ];
        const specification = structuredClone(DefaultSchemaObject);
        const stackObject = new Stack<StackObject>();
        for(const row of rows){
            processor.appendField(row.row, specification, row.inputObject);
        }

        expect(specification).toEqual({
            type: 'object',
            description: '',
            properties: {
                id:{
                    title: 'BUSINESS_INPUTS.DESTINATION_ID',
                    description: 'The id of the impacted service',
                    type: 'number'
                },
                code:{
                    title: 'BUSINESS_INPUTS.DESTINATION_CODE',
                    description: 'The code of the impacted service',
                    type: 'string'
                }
            }
        });

    });

    test('setField - Can set Array field at root level', () => {
        const row = ['', '', '', 'Array', '', '', '', 'impactedServices', 'The list of impacted services.'];
        const specification = structuredClone(DefaultSchemaObject);
        const inputObject = {
            type: 'array',
            items:{

            }
        };
        processor.appendField(row, specification, inputObject);

        expect(specification).toEqual({
            type: 'object',
            description: '',
            properties: {
                impactedServices: {
                    type: 'array',
                    items: {

                    },
                }
            }
        });
    });

    test('setField - Can set OBJECT field at root level', () => {
        const row = ['', '', '', 'Object', '', '', '', 'impactedService', 'The object representing the impacted service'];
        const specification = structuredClone(DefaultSchemaObject);
        const inputObject = {
            type: 'object',
            properties:{

            }
        };
        processor.appendField(row, specification, inputObject);

        expect(specification).toEqual({
            type: 'object',
            description: '',
            properties: {
                impactedService: {
                    type: 'object',
                    properties: {

                    },
                }
            }
        });
    });

    test('setField - Can set OBJECT at root level with children', () => {
        const rows = [
            {
                row: ['', '', '', 'Object', '', '', '', 'impactedService', 'The object representing the impacted service'],
                inputObject:{
                    type: 'object',
                    properties:{

                    }
                }
            },
            {
                row: ['dest_rl_id_col', 'DESTINATION_ID', 'Y', 'Number', '10', '', 'impactedService', 'id', 'The id of the impacted service'],
                inputObject: {
                    title: 'BUSINESS_INPUTS.DESTINATION_ID',
                    description: 'The id of the impacted service',
                    type: 'number'
                }
            }
            ];
        const specification = structuredClone(DefaultSchemaObject);
        const stackObject = new Stack<StackObject>();
        for(const row of rows){
            processor.appendField(row.row, specification, row.inputObject);
        }

        expect(specification).toEqual({
            type: 'object',
            description: '',
            properties: {
                impactedService: {
                    type: 'object',
                    properties: {
                        id:{
                            title: 'BUSINESS_INPUTS.DESTINATION_ID',
                            description: 'The id of the impacted service',
                            type: 'number'
                        }
                    },
                }
            }
        });
    });

    test('setField - Can set Array at root level with children', () => {
        const rows = [
            {
                row: ['', '', '', 'Array', '', '', '', 'impactedServices', 'The array representing the impacted service'],
                inputObject: {
                    type: 'array',
                    items: {}
                }
            },
            {
                row: ['dest_rl_id_col', 'DESTINATION_ID', 'Y', 'Number', '10', '', '', '', 'The id of the impacted service'],
                inputObject: {
                    title: 'BUSINESS_INPUTS.DESTINATION_ID',
                    description: 'The id of the impacted service',
                    type: 'number'
                }
            }
        ];
        const specification = structuredClone(DefaultSchemaObject);
        const stackObject = new Stack<StackObject>();
        for (const row of rows) {
            processor.appendField(row.row, specification, row.inputObject, true);
        }

        console.log('Final Specification: ', JSON.stringify(specification));

        expect(specification).toEqual({
            type: 'object',
            description: '',
            properties: {
                impactedServices: {
                    type: 'array',
                    items: {
                        title: 'BUSINESS_INPUTS.DESTINATION_ID',
                        description: 'The id of the impacted service',
                        type: 'number'
                    },
                }
            }
        });
    });

        test('setField - Can set Array at root level with child object', () => {
            const rows = [
                {
                    row: ['', '', '', 'Array', '', '', '', 'impactedServices', 'The array representing the impacted service'],
                    inputObject: {
                        type: 'array',
                        items: {}
                    }
                },
                {
                    row: ['', '', '', 'Object', '', '', 'impactedServices', 'impactedService', 'The impacted Services Object'],
                    inputObject: {
                        description: 'The id of the impacted service',
                        type: 'object',
                        properties: {}
                    }
                },
                {
                    row: ['dest_rl_id_col', 'DESTINATION_ID', 'Y', 'Number', '10', '', 'impactedServices, impactedService', 'id', 'The id of the impacted service'],
                    inputObject: {
                        title: 'BUSINESS_INPUTS.DESTINATION_ID',
                        description: 'The id of the impacted service',
                        type: 'number'
                    }
                }
            ];
            const specification = structuredClone(DefaultSchemaObject);
            const stackObject = new Stack<StackObject>();
            for (const row of rows) {
                processor.appendField(row.row, specification, row.inputObject, true);
            }

            console.log('Final Specification: ', JSON.stringify(specification));

            expect(specification).toEqual({
                type: 'object',
                description: '',
                properties: {
                    impactedServices: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties:{
                                id:{
                                    title: 'BUSINESS_INPUTS.DESTINATION_ID',
                                    description: 'The id of the impacted service',
                                    type: 'number'
                                }
                            }
                        },
                    }
                }
            });
        });
});
