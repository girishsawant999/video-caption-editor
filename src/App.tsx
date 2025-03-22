import { ConfigProvider } from "antd";
import VideoCaptionEditor from "./components/VideoCaptionEditor";

function App() {
  return (
    <>
      <ConfigProvider theme={{ token: { colorPrimary: "#211C84" } }}>
        <VideoCaptionEditor />
      </ConfigProvider>
    </>
  );
}

export default App;
