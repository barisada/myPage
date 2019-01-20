const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');
const follow = require('./follow')

const root = '/api';
const defaultPageSize = 3;

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {lectures: [], attributes: [], pageSize: defaultPageSize, links:{}};
        this.onCreate = this.onCreate.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
    }

    loadFromServer(pageSize){
        follow(client, root, [{rel: 'lectures', params: {size : pageSize}}])
            .then(lectureCollection => {
                return client({
                    method : 'GET',
                    path: lectureCollection.entity._links.profile.href,
                    headers: {'Accept' : 'application/schema+json'}
                }).then(schema => {
                    this.schema = schema.entity;
                    return lectureCollection;
                });
            }).done(lectureCollection =>{
                this.setState({
                    lectures : lectureCollection.entity._embedded.lectures,
                    attributes: Object.keys(this.schema.properties),
                    pageSize : pageSize,
                    links: lectureCollection.entity._links
                });
            });
    }

    componentDidMount() {
        this.loadFromServer(this.state.pageSize);
    }

    onCreate(newLecture) {
        follow(client, root, ['lectures']).then(lectureCollection => {
            return client({
                method: 'POST',
                path: lectureCollection.entity._links.self.href,
                entity: newLecture,
                headers: {'Content-Type': 'application/json'}
            })
        }).then(response => {
            return follow(client, root, [
                {rel: 'lectures', params: {'size': this.state.pageSize}}]);
        }).done(response => {
            if (typeof response.entity._links.last !== "undefined") {
                this.onNavigate(response.entity._links.last.href);
            } else {
                this.onNavigate(response.entity._links.self.href);
            }
        });
    }

    onNavigate(navUri) {
        client({method: 'GET', path: navUri})
        .done(lectureCollection => {
            this.setState({
                lectures: lectureCollection.entity._embedded.lectures,
                attributes: this.state.attributes,
                pageSize: this.state.pageSize,
                links: lectureCollection.entity._links
            });
        });
    }

    render() {
        return (
            <div>
                <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
                <LectureList lectures={this.state.lectures} 
                                        links={this.state.links}  
                                        pageSize={this.state.pageSize}
							            onNavigate={this.onNavigate}
                                        />
            </div>
        )
    }
}

class CreateDialog extends React.Component {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		e.preventDefault();
		const newLecture = {};
		this.props.attributes.forEach(attribute => {
			newLecture[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
		});
		this.props.onCreate(newLecture);

		// clear out the dialog's inputs
		this.props.attributes.forEach(attribute => {
			ReactDOM.findDOMNode(this.refs[attribute]).value = '';
		});

		// Navigate away from the dialog to hide it.
		window.location = "#";
	}

	render() {
		const inputs = this.props.attributes.map(attribute =>
			<p key={attribute}>
				<input type="text" placeholder={attribute} ref={attribute} className="field"/>
			</p>
		);

		return (
			<div>
				<a href="#createLecture">Create</a>

				<div id="createLecture" className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">X</a>

						<h2>Create new lecture</h2>

						<form>
							{inputs}
							<button onClick={this.handleSubmit}>Create</button>
						</form>
					</div>
				</div>
			</div>
		)
	}
}

class LectureList extends React.Component{
    
    constructor(props) {
		super(props);
		this.handleNavFirst = this.handleNavFirst.bind(this);
		this.handleNavPrev = this.handleNavPrev.bind(this);
		this.handleNavNext = this.handleNavNext.bind(this);
		this.handleNavLast = this.handleNavLast.bind(this);
    }
    
    handleNavFirst(e){
        e.preventDefault();
        this.props.onNavigate(this.props.links.first.href);
    }
    
    handleNavPrev(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.prev.href);
    }
    
    handleNavNext(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.next.href);
    }
    
    handleNavLast(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.last.href);
    }

    render() {
        const lectures = this.props.lectures.map(lecture =>
            <Lecture key={lecture._links.self.href} lecture={lecture} onDelete={this.props.onDelete}/>
        );
    
        const navLinks = [];
        if ("first" in this.props.links) {
            navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
        }
        if ("prev" in this.props.links) {
            navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
        }
        if ("next" in this.props.links) {
            navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
        }
        if ("last" in this.props.links) {
            navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
        }

        return (
            <div>
                <input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
                <table>
                    <tbody>
                    <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Writer</th>
                        <th>마지막 수정 일시</th>
                    </tr>
                    {lectures}
                    </tbody>
                </table>
                <div>
                    {navLinks}
                </div>
            </div>
        );
    }
}

class Lecture extends React.Component{
    render() {
        return (
            <tr>
                <td>{this.props.lecture.id}</td>
                <td>{this.props.lecture.title}</td>
                <td>{this.props.lecture.description}</td>
                <td>{this.props.lecture.creator}</td>
                <td>{this.props.lecture.updatedAt}</td>
            </tr>
        )
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('react')
)