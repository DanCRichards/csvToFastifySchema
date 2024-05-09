

export class Stack<T>{

    private stack: T[];

    constructor(){
        this.stack = [];
    }

    clear(){
        this.stack = [];
    }

    getStack(): T[]{
        return this.stack;
    }

    push(item: T){
        this.stack.push(item);
    }

    pop(): T | undefined{
        return this.stack.pop();
    }

    peek(): T | undefined{
        return this.stack[this.stack.length - 1];
    }

    isEmpty(): boolean{
        return this.stack.length === 0;
    }

    size(): number{
        return this.stack.length;
    }

}