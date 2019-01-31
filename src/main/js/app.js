const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');
const follow = require('./follow')
const when = require('when');
const stompClient = require('./websocket-listener');

const root = '/api';
const defaultPageSize = 3;

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {lectures: [], attributes: [], page:1 , pageSize: defaultPageSize, links:{}};
        this.onCreate = this.onCreate.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.updatePageSize = this.updatePageSize.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
        this.refreshCurrentPage = this.refreshCurrentPage.bind(this);
		this.refreshAndGoToLastPage = this.refreshAndGoToLastPage.bind(this);
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
                    this.links = lectureCollection.entity._links;
                    return lectureCollection;
                });
            }).then(lectureCollection => {
                this.page = lectureCollection.entity.page;
                return lectureCollection.entity._embedded.lectures.map(lecture =>
                        client({
                            method: 'GET',
                            path: lecture._links.self.href
                        })
                );
            }).then(lecturePromises => {
                return when.all(lecturePromises);
            }).done(lectures => {
                this.setState({
                    page: this.page,
                    lectures: lectures,
                    attributes: Object.keys(this.schema.properties),
                    pageSize: pageSize,
                    links: this.links
                });
            });
    }

    componentDidMount() {
        this.loadFromServer(this.state.pageSize);
        stompClient.register([
			{route: '/topic/newLecture', callback: this.refreshAndGoToLastPage},
			{route: '/topic/updateLecture', callback: this.refreshCurrentPage},
			{route: '/topic/deleteLecture', callback: this.refreshCurrentPage}
		]);
    }

    refreshAndGoToLastPage(message) {
        follow(client, root, [{
            rel: 'lectures',
            params: {size: this.state.pageSize}
        }]).done(response => {
            if (response.entity._links.last !== undefined) {
                this.onNavigate(response.entity._links.last.href);
            } else {
                this.onNavigate(response.entity._links.self.href);
            }
        })
    }
    
    refreshCurrentPage(message) {
        follow(client, root, [{
            rel: 'lectures',
            params: {
                size: this.state.pageSize,
                page: this.state.page.number
            }
        }]).then(lectureCollection => {
            this.links = lectureCollection.entity._links;
            this.page = lectureCollection.entity.page;
    
            return lectureCollection.entity._embedded.lectures.map(lecture => {
                return client({
                    method: 'GET',
                    path: lecture._links.self.href
                })
            });
        }).then(lecturePromises => {
            return when.all(lecturePromises);
        }).then(lectures => {
            this.setState({
                page: this.page,
                lectures: lectures,
                attributes: Object.keys(this.schema.properties),
                pageSize: this.state.pageSize,
                links: this.links
            });
        });
    }

    onCreate(newLecture) {
        follow(client, root, ['lectures']).then(lectureCollection => {
            return client({
                method: 'POST',
                path: lectureCollection.entity._links.self.href,
                entity: newLecture,
                headers: {'Content-Type': 'application/json'}
            })
        })
    }

    onUpdate(lecture, updatedLecture) {
        client({
            method: 'PUT',
            path: lecture.entity._links.self.href,
            entity: updatedLecture,
            headers: {
                'Content-Type': 'application/json',
                'If-Match': lecture.headers.Etag
            }
        }).done(response => {
           /* Let the websocket handler update the state */
        }, response => {
            if (response.status.code === 412) {
                alert('DENIED: Unable to update ' +
                    lecture.entity._links.self.href + '. Your copy is stale.');
            }
        });
    }

    onDelete(lecture) {
        client({method: 'DELETE', path: lecture.entity._links.self.href})
    }

    updatePageSize(pageSize) {
        if (pageSize !== this.state.pageSize) {
            this.loadFromServer(pageSize);
        }
    }

    onNavigate(navUri) {
        client({
            method: 'GET', 
            path: navUri
        }).then(lectureCollection => {
            this.links = lectureCollection.entity._links;
            this.page = lectureCollection.entity.page;

			return lectureCollection.entity._embedded.lectures.map(lecture =>
					client({
						method: 'GET',
						path: lecture._links.self.href
					})
			);
		}).then(lecturePromises => {
			return when.all(lecturePromises);
		}).done(lectures => {
			this.setState({
                page: this.page,
				lectures: lectures,
				attributes: Object.keys(this.schema.properties),
				pageSize: this.state.pageSize,
				links: this.links
			});
		});
    }

    render() {
        return (
            <div>
                <CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
                <LectureList lectures={this.state.lectures} 
                                        links={this.state.links}  
                                        page={this.state.page}
                                        pageSize={this.state.pageSize}
                                        attributes={this.state.attributes}
                                        onNavigate={this.onNavigate}
                                        onUpdate={this.onUpdate}
                                        onDelete={this.onDelete}
                                        updatePageSize={this.updatePageSize}
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

class UpdateDialog extends React.Component {

	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		e.preventDefault();
		const updatedLecture = {};
		this.props.attributes.forEach(attribute => {
			updatedLecture[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
		});
		this.props.onUpdate(this.props.lecture, updatedLecture);
		window.location = "#";
	}

	render() {
        //using index is an anti-pattern. But it used to get rid of 'Encountered two children with the same key,...' warning message.
        const inputs = this.props.attributes.map((attribute, idx) =>
			<p key={this.props.lecture.entity[attribute] + idx}>
				<input type="text" placeholder={attribute}
					   defaultValue={this.props.lecture.entity[attribute]}
					   ref={attribute} className="field"/>
			</p>
		);
        
        const dialogId = "updatedLecture-" + this.props.lecture.entity._links.self.href;

		return (
			<div key={this.props.lecture.entity._links.self.href}>
				<a href={"#" + dialogId}>Update</a>
				<div id={dialogId} className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">X</a>

						<h2>Update a lecture</h2>

						<form>
							{inputs}
							<button onClick={this.handleSubmit}>Update</button>
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
		this.handleInput = this.handleInput.bind(this);
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

    handleInput(e) {
        e.preventDefault();
        const pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
        if (/^[0-9]+$/.test(pageSize)) {
            this.props.updatePageSize(pageSize);
        } else {
            ReactDOM.findDOMNode(this.refs.pageSize).value =
                pageSize.substring(0, pageSize.length - 1);
        }
    }

    render() {
        const pageInfo = this.props.page.hasOwnProperty("number") ?
            <h3>Employees - Page {this.props.page.number + 1} of {this.props.page.totalPages}</h3> : null;
            
        const lectures = this.props.lectures.map(lecture =>
            <Lecture key={lecture.entity._links.self.href} 
                            lecture={lecture}  
                            attributes={this.props.attributes}
                            onUpdate={this.props.onUpdate}
                            onDelete={this.props.onDelete}/>
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
                {pageInfo}
                <input ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
                <table>
                    <tbody>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Description</th>
                            <th>Writer</th>
                            <th>마지막 수정 일시</th>
                            <th>수정</th>
                            <th>삭제</th>
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
    
	constructor(props) {
		super(props);
		this.handleDelete = this.handleDelete.bind(this);
	}

	handleDelete() {
		this.props.onDelete(this.props.lecture);
    }
    
    render() {
        return (
            <tr>
                <td>{this.props.lecture.entity.id}</td>
                <td>{this.props.lecture.entity.title}</td>
                <td>{this.props.lecture.entity.description}</td>
                <td>{this.props.lecture.entity.creator}</td>
                <td>{this.props.lecture.entity.updatedAt}</td>
                <td>
					<UpdateDialog lecture={this.props.lecture} attributes={this.props.attributes} onUpdate={this.props.onUpdate}/>
				</td>
                <td>
					<button onClick={this.handleDelete}>Delete</button>
				</td>
            </tr>
        )
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('react')
)