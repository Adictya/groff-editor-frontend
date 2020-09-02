import React from "react";
import SplitPane from "react-split-pane";
import "./editor.css";
import { Tabs } from "antd";
// import Pdf from "react-to-pdf";
import Navbar from "../components/Navbar/navbar";
import CodeEditor from "../components/CodeEditor/codeEditor";
import DocPreview from "../components/DocPreview/docPreview";
import MyContext from "../context/MyContext";

import socketIOClient from "socket.io-client";

const client = socketIOClient("wss://groffapi.dscvit.com");

const { TabPane } = Tabs;
// const ref = React.createRef();

// Backend Integration : Route to rename document on change (Might have to introduce commit function when focus changed from input to minimize backend calls)
// Backend Integration : Route to fetch Document Data directly from Backend based on url param instead of context Api to limit app re render events.

class Editor extends React.Component {
	static contextType = MyContext;
	constructor(props) {
		super(props);
		this.state = {
			timestamp: "no timestamp yet",
			Document: "",
			Modified: false,
			theme: "monokai",
			windowWidth: window.innerWidth,
			windowHeight: window.innerHeight - 50,
			preview: false,
			op: "Write in Code Editor to See Output here",
			//Hard COded for testing
			Output: {
				token:
					"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImphbmVkb2VAZXhhbXBsZS5jb20iLCJ1c2VySWQiOiI1ZjQ3NWIyZTBkODUwODMxOGMxY2MzNGQiLCJpYXQiOjE1OTg3MDc5NTcsImV4cCI6MTU5ODcxMTU1N30.MgkEtavHHsFkivSJ9tnFuvLriQ2L0Z72DCa9AHHPMZQ",
				user_id: "5f474666872d6a141f53da20",
				fileName: "sampletext.txt",
			},
		};
		this.preview = React.createRef();
	}
	handleResize = (e) => {
		this.setState({
			windowWidth: window.innerWidth,
		});
		if (this.preview.current) {
			this.setState({
				previewWidth: this.preview.current.offsetWidth,
			});
		}
	};
	componentDidMount = () => {
		let CurrentDoc = this.context.documents.find((doc) => {
			return doc.id === this.props.match.params.doc;
		});
		this.update = setInterval(() => {
			if (this.state.Modified) {
				client.emit("cmd", this.state.Output);
				this.setState({ Modified: false });
				console.log(this.state.Output);
			}
		}, 2000);
		client.on("cmd", (response) => {
			this.setState({ op: response });
			console.log(response);
		});
		this.setState({
			Document: CurrentDoc,
		});
		if (this.preview.current) {
			this.setState({
				previewWidth: this.preview.current.offsetWidth,
			});
		}
		window.addEventListener("resize", this.handleResize);
	};

	componentDidUpdate = () => {
		window.addEventListener("resize", this.handleResize);
	};
	componentWillUnmount() {
		clearInterval(this.update);
	}

	pdfConvert = () => {};

	handleback = () => {
		this.props.history.goBack();
	};

	handleLogout = () => {
		this.props.history.push("/");
		this.context.Logout();
	};

	handleRename = (e) => {
		this.setState({ Document: { name: e.target.value } });
		// BackendIntegration : Rename Call here
		client.emit("cmd", e.target.value);
	};

	handleCode = (value) => {
		this.setState({
			Modified: true,
			Output: {
				...this.state.Output,
				data: value,
			},
		});
	};
	themeSelector = (e) => {
		this.setState({ theme: e.target.value });
	};

	TabSwitch = () => {
		this.setState({
			preview: !this.state.preview,
		});
		// Tabs.activeKey === 1 ? (Tabs.activeKey = 2) : (Tabs.activeKey = 1);
		console.log(Tabs.activeKey);
		this.handleResize();
	};

	codeEditorElement() {
		return (
			<select
				name="theme"
				label="theme select"
				id="theme"
				onChange={this.themeSelector}
				placeholder="Select a theme"
				style={{
					float: "right",
				}}
			>
				<option value="monokai">Monokai</option>
				<option value="nord_dark">Nord</option>
				<option value="solarized_light">Solarized Light</option>
				<option value="solarized_dark">Solarized Dark</option>
				<option value="github">Github</option>
			</select>
		);
	}

	render() {
		let small = 768;
		return (
			<div className="EditorBackground">
				<Navbar
					back={this.handleback}
					logout={this.handleLogout}
					Rename={this.handleRename}
					toPrint={this.preview}
				>
					{this.state.Document.name}
				</Navbar>

				<div className="DocumentContainer">
					{this.state.windowWidth > small ? (
						<SplitPane
							split="vertical"
							primary="second"
							minSize={this.state.windowWidth / 2}
						>
							<div
								style={{
									padding: "20px",
									height: "100%",
								}}
							>
								<CodeEditor
									codeStream={this.handleCode}
									theme={this.state.theme}
								></CodeEditor>
							</div>
							<div
								className="PreviewContainer"
								ref={this.preview}
							>
								<DocPreview ElWidth={this.state.previewWidth}>
									{this.state.op}
								</DocPreview>
							</div>
						</SplitPane>
					) : (
						<Tabs activeKey={this.state.preview ? "1" : "2"}>
							<TabPane key="1">
								<div
									style={{
										height: this.state.windowHeight,
										marginTop: "10px",
									}}
								>
									<CodeEditor
										codeStream={this.handleCode}
										theme={this.state.theme}
									></CodeEditor>
									<button
										className="tabButton"
										onClick={() => {
											this.TabSwitch();
										}}
									>
										Preview &#10095;
									</button>
								</div>
							</TabPane>
							<TabPane key="2">
								<div className="DocPreview" ref={this.preview}>
									<DocPreview
										ElWidth={this.state.previewWidth}
									>
										{this.state.op}
									</DocPreview>
									<button
										className="tabButton"
										onClick={() => {
											this.TabSwitch();
										}}
									>
										&#10094; Code
									</button>
								</div>
							</TabPane>
						</Tabs>
					)}
				</div>
			</div>
		);
	}
}
export default Editor;
