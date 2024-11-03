class Example {
    @observable
    x = 5;
    @computed
    get doubled() {
        return this.x * 2;
    }
}
