const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');
const follow = require('./follow')

const root = '/api';
const defaultPageSize = 2;

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {lectures: [], attributes: [], pageSize: defaultPageSize, links:{}};
        this.onCreate = this.onCreate.bind(this);
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

    render() {
        return (
            <div>
                <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
                <LectureList lectures={this.state.lectures}/>
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
    render() {
        const lectures = this.props.lectures.map(lecture =>
            <Lecture key={lecture._links.self.href} lecture={lecture}/>
        );
        return (
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