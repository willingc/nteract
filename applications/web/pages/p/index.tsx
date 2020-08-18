// Other
import React, { FC, HTMLAttributes, useState, useEffect } from "react";
import { WithRouterProps } from "next/dist/client/with-router";
import { withRouter, useRouter } from "next/router";
import { Octokit } from "@octokit/rest";
import moment from "moment";

// nteract
import Notebook from "@nteract/stateful-components";
import dynamic from "next/dynamic";
import { Host } from "@mybinder/host-cache";
import NotebookApp from "@nteract/notebook-app-component";
import { CodeCell } from "@nteract/stateful-components";
import { Input, Prompt, Source, Outputs, Cell } from "@nteract/presentational-components";
const CodeMirrorEditor = dynamic(() => import('@nteract/editor'), { ssr: false });

// Custom
import { Menu, MenuItem } from '../../components/Menu'
import { Button } from '../../components/Button'
import { Console } from '../../components/Console'
import { BinderMenu } from '../../components/BinderMenu'
import { Avatar } from '../../components/Avatar'
import { Inp } from '../../components/Input'
import { Dialog, Shadow, DialogRow, DialogFooter } from '../../components/Dialog';
import { FilesListing } from "../../components/FilesListing"
import { Layout, Header, Body, Side, Footer } from "../../components/Layout"
import { H3, P } from "../../components/Basic"
import NextHead from "../../components/Header";
import { getLanguage, getPath } from "../../util/helpers"
import { ghUploadToRepo, ghCheckFork } from "../../util/github"
import { runIcon, saveIcon, menuIcon, githubIcon, consoleIcon, pythonIcon, serverIcon, commitIcon } from "../../util/icons"


const Binder = dynamic(() => import("../../components/Binder"), {
  ssr: false
});

const BINDER_URL = "https://mybinder.org";

function useInput(val: string | undefined) {
  const [value, setValue] = useState(val);

  function handleChange(e: React.FormEvent<HTMLInputElement> | React.FormEvent<HTMLSelectElement>) {
    setValue(e.currentTarget.value);
  }

  return {
    value,
    onChange: handleChange
  }
}

function useCheckInput(val: boolean | undefined) {
  const [value, setValue] = useState(val);

  function handleChange(e: React.FormEvent<HTMLInputElement>) {
    setValue(e.currentTarget.checked);
  }

  return {
    value,
    onChange: handleChange
  }
}


export interface Props extends HTMLAttributes<HTMLDivElement> {
  router: any
}

export const Main: FC<WithRouterProps> = (props: Props) => {
  const router = useRouter()
  // Toggle Values
  const [showBinderMenu, setShowBinderMenu] = useState(false)
  const [showConsole, setShowConsole] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  // Git API Values
  const [filePath, setFilepath] = useState(router.query.file as string)
  const [fileContent, setFileContent] = useState("")
  const [fileType, setFileType] = useState("")
  const [provider, setProvider] = useState(router.query.vcs as string)
  const [org, setOrg] = useState(router.query.org as string)
  const [repo, setRepo] = useState(router.query.repo as string)
  const [gitRef, setGitRef] = useState(router.query.ref as string)
  // File info
  const [lang, setLang] = useState("markdown")
  // Commit Values
  const commitMessage = useInput("Auto commit from nteract web")
  // This should be a boolean value but as a string
  const stripOutput = useCheckInput(false)
  const [fileBuffer, setFileBuffer] = useState({})
  const [savedTime, setSavedTime] = useState(moment())
  const [savedSince, setSavedSince] = useState("Last Saved Never")

  // Server
  const [serverStatus, setServerStatus] = useState("Connecting...")
  const [serverEndpoint, setServerEndpoint] = useState("")
  const [serverToken, setServerToken] = useState("")

  // Login Values
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState("")
  const [userImage, setUserImage] = useState("")
  const [userLink, setUserLink] = useState("")


  /*
  * TODO: Add @nteract/mythic-notifications to file
  */


  // TODO: Replace all placeholder console with notification


  // This Effect runs only when the username change
  useEffect(() => {
    // Check if user has a token saved
    if (localStorage.getItem("token") != undefined) {
      getGithubUserDetails()
    }
  }, [username])

  // To keep the link updated for users to share it
  useEffect(() => {
    router.push(`/p?vcs=${provider}&org=${org}&repo=${repo}&ref=${gitRef}&file=${filePath}`, undefined, { shallow: true })

  }, [provider, org, repo, gitRef, filePath])



  function addBuffer(e) {
    setFileContent(e);
    const newFileBuffer = fileBuffer
    newFileBuffer[filePath] = e
    setFileBuffer(newFileBuffer)
  }

  function toggle(value, setFunction) {
    setFunction(!value)
  }

  function run() {
    console.log("run binder here")
  }

  function showSave() {
    toggle(showSaveDialog, setShowSaveDialog)
  }

  // To save/upload data to github
  const onSave = async (event) => {
    event.preventDefault()

    // Step 1: Check if buffer is empty
    if (Object.keys(fileBuffer).length == 0) {
      console.log("Notification: No changes in data")
      return
    }

    // Step 2: Get authentication of user
    const auth = localStorage.getItem("token")
    const octo = new Octokit({
      auth
    })

    // Step 3: Find fork or handle in case it doesn't exist.
    await ghCheckFork(octo, org, repo, gitRef, username).then(() => {
      // Step 4: Since user is working on the fork or is owner of the repo
      setOrg(username)
      // Step 5: Upload to the repo from buffer
      try {
        ghUploadToRepo(octo, username, repo, gitRef, fileBuffer, commitMessage.value).then(() => {
          // Step 6: Empty the buffer
          setFileBuffer({})
          console.log("Notification: Data Saved")
          // Update time of save
          setSavedTime(moment())
        })
      } catch (err) {
        console.log("Notification: Error in upload")
      }
    }).catch((e) => {
      console.log("Notification: Repo not found")
    })

  }



  // Folder Exploring Function
  async function getFiles(path: string) {
    const octokit = new Octokit()
    let fileList: string[][] = []
    await octokit.repos.getContents({
      owner: org,
      repo: repo,
      ref: gitRef,
      path
    }).then((res: any) => {
      res.data.map((item: any) => {
        fileList.push([item.name, item.path, item.type])
      })
    }, (e: Error) => {
      fileList = [[""]]
      console.log("Notification: Repo not found")
    })
    return fileList

  }

  function loadFile(fileName) {
    if (fileName in fileBuffer) {
      setFileContent(fileBuffer[fileName])
      setFilepath(fileName)
      setFileType(fileName.split('.').pop())
    } else {
      const octokit = new Octokit()
      octokit.repos.getContents({
        owner: org,
        repo: repo,
        path: fileName
      }).then(({ data }) => {
        setFileContent(atob(data["content"]))
        setFilepath(data["path"])
        setFileType(fileName.split('.').pop())
      })
    }

    let extension = fileName.split('.').pop()
    setLang(getLanguage(extension))
  }

  function updateVCSInfo(event, provider, org, repo, gitRef) {
    // TODO: Add a loading experience for the users and error if project not found
    event.preventDefault()
    setProvider(provider)
    setOrg(org)
    setRepo(repo)
    setGitRef(gitRef)
    // To empty buffer when repo is updated
    setFileBuffer({})
  }

  function OAuthGithub() {
    if (localStorage.getItem("token") == undefined) {
      window.open('https://github.com/login/oauth/authorize?client_id=83370967af4ee7984ea7&scope=repo,read:user&state=23DF32sdGc12e', '_blank');
      window.addEventListener('storage', getGithubUserDetails)
    }
  }

  function getGithubUserDetails() {
    const token = localStorage.getItem("token")
    fetch("https://api.github.com/user", {
      method: "GET",
      headers: new Headers({
        "Authorization": "token " + token
      })

    })
      .then((res) => res.json())
      .then((data) => {
        if (data["login"] !== undefined) {
          setLoggedIn(true)
          setUsername(data["login"])
          setUserLink(data["html_url"])
          setUserImage(data["avatar_url"])
        } else {
          // Login failed | also give notification here
          localStorage.removeItem("token")
        }
      })
    window.removeEventListener("storage", getGithubUserDetails)
  }

  const addBinder = (host) => {
    console.log(host)
    setServerStatus("Connected")
    setServerEndpoint(host.endpoint)
    setServerToken(host.token)
  }




  const dialogInputStyle = { width: "98%" }

  return (
    <Layout>

      <NextHead />
      {
        showBinderMenu &&

        <BinderMenu
          provider={provider}
          org={org}
          repo={repo}
          gitRef={gitRef}
          updateVCSInfo={updateVCSInfo}
          style={{
            height: "150px",
            position: "absolute",
            marginTop: "49px",
            width: "calc(100% - 260px)",
            right: "0px",
            borderBottom: "1px solid #FBECEC",
          }}
        />
      }

      {
        showConsole && <Console style={{
          position: "absolute",
          bottom: "30px",
          right: "0px",
          width: "calc(100% - 260px)"
        }}>
          <a style={{ color: "#fff" }} href={`${serverEndpoint}?token=${serverToken}`}> {serverEndpoint}?token={serverToken} </a>

        </Console>
      }

      {showSaveDialog &&
        <>
          <Shadow onClick={() => toggle(showSaveDialog, setShowSaveDialog)} />
          <Dialog >
            <form onSubmit={(e) => onSave(e)} >
              <DialogRow>
                <Inp id="commit_message" variant="textarea" label="Commit Message" {...commitMessage} autoFocus style={dialogInputStyle} />
              </DialogRow>
              <DialogRow>
                <Inp id="strip_output" variant="checkbox" label="Strip the notebook output?" checked={stripOutput.value} onChange={stripOutput.onChange} style={dialogInputStyle} />
              </DialogRow>
              t          <DialogFooter>
                <Button id="commit_button" text="Commit" icon={commitIcon} />
              </DialogFooter>
            </form>
          </Dialog>
        </>
      }

      <Header>
        <Menu>
          <MenuItem>
            <Button text="Run" variant="outlined" icon={runIcon} onClick={() => run()} />
          </MenuItem>
          {loggedIn &&
            <MenuItem>
              <Button text="Save" variant="outlined" icon={saveIcon} onClick={() => showSave()} />
            </MenuItem>
          }

          <MenuItem>
            <Button text="Menu" variant="outlined" icon={menuIcon} onClick={() => toggle(showBinderMenu, setShowBinderMenu)} />
          </MenuItem>

        </Menu>
        <Menu>
          <MenuItem >
            {loggedIn
              ? <Avatar userImage={userImage} username={username} userLink={userLink} />
              : <Button onClick={() => OAuthGithub()} text="Connect to Github" icon={githubIcon} />
            }
          </MenuItem>
        </Menu>
      </Header>
      <Side>
        <img
          src="https://media.githubusercontent.com/media/nteract/logos/master/nteract_logo_cube_book/exports/images/png/nteract_logo_wide_clear_space_purple.png"
          alt="nteract logo"
          className="logo"
        />
        <FilesListing
          loadFile={loadFile}
          loadFolder={getFiles}
          org={org}
          repo={repo}
          gitRef={gitRef}
        />
      </Side>
      <Body>
        <Cell isSelected>
          <Input>
            <Prompt counter={2} />
            <Source language="python">{`print("Hello World")`}</Source>
          </Input>
          <Outputs>
            <pre>Hello World</pre>
          </Outputs>
        </Cell>


        <Host repo={`${org}/${repo}`} gitRef={gitRef} binderURL={BINDER_URL}>
          <Host.Consumer>
            {host => <>
              <Binder filepath={filePath} host={host} />
            </>}
          </Host.Consumer>
        </Host>

        {fileContent &&

          <CodeMirrorEditor
            editorFocused
            completion
            autofocus
            codeMirror={{
              lineNumbers: true,
              extraKeys: {
                "Ctrl-Space": "autocomplete",
                "Ctrl-Enter": () => { },
                "Cmd-Enter": () => { }
              },
              cursorBlinkRate: 0,
              mode: lang
            }}
            preserveScrollPosition
            editorType="codemirror"
            onFocusChange={() => { }}
            focusAbove={() => { }}
            focusBelow={() => { }}
            kernelStatus={"not connected"}
            value={fileContent}
            onChange={(e) => { addBuffer(e) }}
          />


        }

        {
          !fileContent &&

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "180px" }}>

            <H3>Welcome to nteract play</H3>
            <P>
              nteract play is an awesome environment for you to reproduce a notebook project quickly and edit a notebook without installing additional software. It takes just a few seconds to get started.

                        <ol>
                <li>Click on the menu above, and provide the path to the repository you want to reproduce. </li>
                <li>Use file explorer to open, run and edit files. </li>
                <li>Connect to GitHub to save back your changes. </li>
                <li>Share the above link to your network so they can reproduce your notebook. </li>
              </ol>
              Made with love by nteract contributors.
                      </P>

          </div>

        }
      </Body>

      <Footer>

        <Menu>
          <MenuItem>
            <Button text="Console" icon={consoleIcon} variant="transparent" onClick={() => toggle(showConsole, setShowConsole)} />
          </MenuItem>
          <MenuItem>
            <Button text="Python 3" icon={pythonIcon} variant="transparent" disabled />
          </MenuItem>
          <MenuItem>
            <Button text={serverStatus} icon={serverIcon} variant="transparent" disabled />
          </MenuItem>
        </Menu>
        <Menu>
          <MenuItem>
            {savedTime.fromNow()}
          </MenuItem>
        </Menu>
      </Footer>
    </Layout>
  );
}

export default withRouter(Main);
