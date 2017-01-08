/* Micro framework for building react based applications */
class App extends React.Component {
    constructor(props) {
        super(props)

        const setView = (view) => this.view = view? view: this.view
        const getState = () => this.state
        const setState = (state) => this.setState(state)

        this.view = () => React.DOM.h1(null, 'Loading')
        this.state = JSON.parse(JSON.stringify(props.state))

        this.actions = {
            render: (component) => {
                this.view = component? component: props.home
                this.setState(this.state)
            }
        }

        for(let k in this.props.reducers) {
            if(!this.props.reducers.hasOwnProperty(k))
                continue

            const reducer = this.props.reducers[k]

            this.actions[k] = function() {
                try {
                    const state = getState()
                    setView(reducer(state, ...arguments))
                    setState(state)
                } catch(e) {
                    console.log(reducer.name, arguments, state, e)
                }
            }
        }

        for(let k in this.props.actions) {
            if(!this.props.actions.hasOwnProperty(k))
                continue

            const action = this.props.actions[k]
            const pending = this.props.reducers[k + '_PromisePending']
            const resolved = this.props.reducers[k + '_PromiseResolved']
            const rejected = this.props.reducers[k + '_PromiseRejected']

            this.actions[k] = function() {
                const promise = action(...arguments)

                try {
                    const state = getState()
                    setView(pending(state))
                    setState(state)

                    promise.then(r => {
                        const state = getState()

                        try {
                            setView(resolved(state, r))
                            setState(state)
                        } catch(e) {
                            console.log(resolved.name, state, e)
                        }
                    }).catch(e => {
                        const state = getState()

                        try {
                            setView(rejected(state, e))
                            setState(state)
                        } catch(e) {
                            console.log(rejected.name, state, e)
                        }
                    })
                } catch(e) {
                    console.log(e)
                }
            }
        }

        console.log('initialized')
    }

    componentDidMount() {
        window.onhashchange = () => {
            const a = document.createElement('a')
            a.href = window.location
            this.actions[a.hash.slice(2)]()
        }
        this.actions.render()
    }

    render() {
        return React.createElement(this.view, {
            state: this.state,
            actions: this.actions
        })
    }

    static mount(state, actions, reducers, home, div_id) {
        let div = document.getElementById(div_id)

        if(undefined === div_id) {
            div = document.createElement('div')
            document.body.appendChild(div)
        }

        ReactDOM.render(
            React.createElement(App, {state, actions, reducers, home}),
            div)
    }
}
