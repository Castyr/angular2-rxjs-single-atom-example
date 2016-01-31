
/// <reference path="../node_modules/immutable/dist/immutable.d.ts" />

import "angular2/bundles/angular2-polyfills";
import {Component, provide, Inject} from "angular2/core";
import {HTTP_PROVIDERS} from "angular2/http";
import {Header} from "./Header";
import {TodoList} from "./TodoList";
import {Todo} from "./Todo";
import {Footer} from "./Footer";
import {TodoService} from "./TodoService";
import {LoadTodosAction, AddTodoAction, StartBackendAction, EndBackendAction, Action} from "./state/todoActions";
import {List} from "immutable";
import {bootstrap} from "angular2/platform/browser";
import {dispatcher, state, initialState} from "./di-tokens";
import {Subject} from "rxjs/Subject";
import {applicationStateFactory} from "./state/applicationStateFactory";
import {Observable} from "rxjs/Observable";
import {ApplicationState} from "./state/application-state";
import {Observer} from "rxjs/Observer";
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/scan';
import {UiState, initialUiState} from "./state/ui-state";
import './getName';

@Component({
    selector: 'app',
    directives: [Header, TodoList, Footer],
    template: `
        <div>
            <section id="todoapp">

                <todo-header (todo)="onAddTodo($event)"></todo-header>

                <todo-list [todos]="todos"></todo-list>

                <todo-footer [hidden]="todos.size === 0" [count]="todos.size"></todo-footer>

            </section>
            <footer id="info">
                <p>{{uiState.message}}</p>
                <p>Add, Remove and Complete TODOs</p>
            </footer>
        </div>
    `
})
export class App {

    todos: List<Todo> = List([]);
    private uiState: UiState = initialUiState;

    constructor(@Inject(dispatcher) private dispatcher: Observer<Action>,
                @Inject(state) private state: Observable<ApplicationState>,
                private todoService: TodoService) {

        todoService.getAllTodos()
            .subscribe(
                res => {
                    todos = (<Object[]>res.json()).map((todo: any) =>
                        new Todo({id:todo.id, description:todo.description,completed: todo.completed}));

                    dispatcher.next(new LoadTodosAction(List(todos)));
                },
                err => console.log("Error retrieving Todos")
            );

        state.subscribe(
            state => {
                this.todos = state.todos;
                this.uiState = state.uiState;
            }
        );
    }

    onAddTodo(description) {
        let newTodo = new Todo({id:Math.random(), description});

        this.dispatcher.next(new StartBackendAction('Saving Todo...'));

        this.todoService.saveTodo(newTodo)
            .subscribe(
                res => {
                    this.dispatcher.next(new AddTodoAction(newTodo));
                    this.dispatcher.next(new EndBackendAction(null));
                },
                err => {
                    this.dispatcher.next(new EndBackendAction('Error occurred: '));
                }
            );
    }

}

bootstrap(App, [
    HTTP_PROVIDERS,
    TodoService,
    provide(initialState, {useValue: {todos: List([]), uiState: initialUiState}}),
    provide(dispatcher, {useValue: new Subject<Action>()}),
    provide(state, {useFactory: applicationStateFactory, deps: [new Inject(initialState), new Inject(dispatcher)]})
]);