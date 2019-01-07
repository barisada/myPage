const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {lectures: []};
    }

    componentDidMount() {
        client({method: 'GET', path: '/api/lectures'}).done(response => {
            this.setState({lectures: response.entity._embedded.lectures});
        });
    }

    render() {
        return (
            <LectureList lectures={this.state.lectures}/>
        )
    }
}

class LectureList extends React.Component{
    render() {
        const lectures = this.props.lectures.map(lecture =>
            <Lecture key={lecture._links.self.href} lecture={lecture}/>
        );
        return (
            <table border="1">
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