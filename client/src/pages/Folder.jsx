//REACT & Contexts
import * as React from 'react';
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from '../context/UserAuthContext';
//FIREBASE
import { getFirestore, collection, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes, uploadString } from 'firebase/storage';
import { v4 } from "uuid";
import { app, storage } from "../firebase";
//ASSETS
import FileCard from "../assets/FileAdd/fileCard";

//ICONS
import DesignServicesIcon from '@mui/icons-material/DesignServices';

//ASSETS

import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Example from "../assets/FileAdd/VideoUpload";
//CSS
import '../Css/folder.css';


function Folder({folderURL}) {


//<******************************VARIABLES*******************************>

//COMMON VARIABLES
const db = getFirestore(app);
const navigate  = useNavigate()
const { currentuser } = useAuth();
const { id } = useParams();
const folderID = id

//MODAL ACTIVITY
const [isActive, setIsActive] = useState(false);
const [isLinkActive, setIsLinkActive] = useState(false);
const [isUploadActive, setIsUploadActive] = useState(false);
const [selectedPopUp, setSelectedPopUp] = useState(null);

//CURRENT ELEMENTS IN ARRAY
const [folderElements, setFolderElements] = useState([]);
const [userData,setUserData] = useState([])

//CREATE BTN AND EDITING ON MODAL
const [isAddedOn, setIsAddedOn] = useState(false);
const [isEditing, setIsEditing] = useState(false);

//FILE CREATION
const [userFile, setUserFile] = useState([]);
const [fileTitle , setFileTitle] = useState("Untitled")
const [fileImage, setFileImage] = useState("")
const [trimmedVideoFile, setTrimmedVideoFile] = useState(null);
const [audioFile, setAudioFile] = useState(null);
const [metaData, setMetaData] = useState(null)
const [tag,setTag] = useState("")

//Provided LINK/FILE
const [linkProvided, setLinkProvided] = useState(true);
const [uploadProvided, setUploadProvided] = useState(true);
const [newTitle, setNewTitle] = useState(folderElements.title);


//<******************************FUNCTIONS*******************************>

//UPDATE THE NUM OF ELEMENTS IN FOLDER
useEffect(() => {
  if (currentuser){
    if(folderElements.length !== 0){
      const currentUserId = currentuser.uid;
      const urlID = id;
      const folderRef = doc(db,"users",currentUserId,"File-Storage",urlID)
      updateDoc(folderRef,{
        files_count: userFile.length,
      })
    }
  }
}, [userFile]);

//FETCH FOLDER DATA
const fetchData = async () => {
  try {
    if (currentuser) {
      const currentUserId = currentuser.uid;
      const urlID = id; 
      // Folder ELEMENT FETCH
      const userSnapshot = await fetch(`http://localhost:3000/user/${currentUserId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
      });
      const docSnapshot = await fetch(`http://localhost:3000/folder/${urlID}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: currentUserId, folderId: urlID}),
      });
      if (docSnapshot.status === 200) {
        // Document exists, retrieve its data
        const elementData = await docSnapshot.json();
        setFolderElements(elementData);
        setNewTitle(elementData.title);
      } else {
        console.log("Document does not exist.");
        setFolderElements(null);
      };
      if (userSnapshot.status === 200) {
        // Document exists, retrieve its data
        const elementUserData = await userSnapshot.json();
        setUserData(elementUserData)
      } else {
        console.log("Document does not exist.");
        setUserData(null); // Set to null or handle accordingly
      }
    };
  } catch (error) {
    console.error("Error getting document: ", error);
    window.location.href = "/";
  };
};

//FETCH FILES IN FOLDER
const fetchUserFolder = async () => {
  if (!currentuser) {
    setUserFile([]);
    console.log("No user logged in");
    return;
  }
  // USER ID & FIRESTORE REF
  const currentUserId = currentuser.uid;
  const urlID = id;
  //const colRef = collection(db, "users", currentUserId, "File-Storage");
const folderResponse = await fetch(`http://localhost:3000/folder/file`,{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: currentUserId, folderId: urlID}),
  })
  if (folderResponse.status === 200) {
    // Document exists, retrieve its data
    const folderData = await folderResponse.json();
    setUserFile(folderData);
  } else {
    console.log("Document does not exist.");
    setUserFile([]); // Set to null or handle accordingly
  }   
}

//ON PAGE LOAD AND REFRESH
useEffect(() => {
  folderURL(folderID);
  // Call fetchData
  fetchData();
  fetchUserFolder();
}, [id, currentuser]);

// MODAL POP UP LOGIC
const togglePopup = () => {
  setIsActive(!isActive);
};

// HANDLE SUBMIT
function handleSubmit(e) {
  e.preventDefault();
  togglePopup();
};

// SELECT POP UP LOGIC
const pickedPopup = () => {
  if (selectedPopUp == 1) {
    togglePopup();
    setIsUploadActive(!isUploadActive)
  } else if (selectedPopUp == 0) {
    togglePopup();
    setIsLinkActive(!isLinkActive)
  };
};

//SAVING FILE TO FIRESTORE
const createFile = async () => {
  if (currentuser && metaData.videoDuration < 10 && userData.subscription == false) {
    const currentUserId = currentuser.uid;
    const urlID = id;
  
    const folderFileId = `file_${v4()}`
    // STORAGE
    const audioMetadata = {
      contentType: 'audio/mp3',
    };
    // FILE NAME
    const allName = `${v4() + metaData.videoName}`
    const metaName = `videos/${allName}`
    const audioName = `audio/${allName}`
    // PATH NAME
    const storagePathVideo = `${"users"+ "/" + currentuser.uid + "/" + urlID + "/" + folderFileId + "/" + metaName}`;
    const storagePathAudio = `${"users"+ "/" + currentuser.uid + "/" + urlID + "/" + folderFileId + "/" + audioName}`;
    // STORAGE REF
    const videoRef = ref(storage, storagePathVideo);
    const audioRef = ref(storage, storagePathAudio);
    // UPLOAD TO STORAGE
    await uploadString(videoRef, trimmedVideoFile,'data_url',metaData)
    await uploadBytes(audioRef, audioFile,audioMetadata)
    // VIDEO URL
    const storageURL =  await getDownloadURL(videoRef);
    console.log("Video Uploaded To Storage")
    // Title
    const userFileTitle = fileTitle
    // Image URL
    const userFileImage = fileImage
    // TAG NAME 
    const userTag = tag
    //VIDEO SIZE
    const videoSize = metaData.videoSize 
    // DURATION
    const userVideoURL = storageURL
    // SET NEW FILE 
    const newFile = {
      content:"",
      title: userFileTitle,
      img: userFileImage,
      url: userVideoURL,
      id: folderFileId,
      folder_id: folderID,
      tag: userTag,
      duration: metaData.videoDurationString,
      storage_path_video: storagePathVideo,
      storage_path_audio: storagePathAudio,
      transcription:"",
      related_count: 0,
      video_size: videoSize
    };

    //UPDATE VIDEO
    const createResponse = await fetch(`http://localhost:3000/folder/file-create/${folderID}`,{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileToUpload: newFile, userId: currentUserId, currentStorageTake: userData.storage_take, videoSize: videoSize}),
    })
    if (createResponse.status === 200) {
      // Document exists, retrieve its data
      const StatusLog = await createResponse.json();
      console.log(StatusLog)
    }else  {
      alert("Something went wrong, try refreshing the page !");
    }
    //UPDATE LOCAL SCREEN
    await fetchData()
    await fetchUserFolder()

  } else if(currentuser && userData.subscription == true) {
    const currentUserId = currentuser.uid;
    const urlID = id;
    const folderFileId = `file_${v4()}`
    // STORAGE
    const audioMetadata = {
      contentType: 'audio/mp3',
    };
    // FILE NAME
    const allName = `${v4() + metaData.videoName}`
    const metaName = `videos/${allName}`
    const audioName = `audio/${allName}`
    // PATH NAME
    const storagePathVideo = `${"users"+ "/" + currentuser.uid + "/" + urlID + "/" + folderFileId + "/" + metaName}`;
    const storagePathAudio = `${"users"+ "/" + currentuser.uid + "/" + urlID + "/" + folderFileId + "/" + audioName}`;
    // STORAGE REF
    const videoRef = ref(storage, storagePathVideo);
    const audioRef = ref(storage, storagePathAudio);
    // UPLOAD TO STORAGE
    await uploadString(videoRef, trimmedVideoFile,'data_url',metaData)
    await uploadBytes(audioRef, audioFile,audioMetadata)
    // VIDEO URL
    const storageURL =  await getDownloadURL(videoRef);
    console.log("Video Uploaded")
    // Title
    const userFileTitle = fileTitle
    // Image URL
    const userFileImage = fileImage
    // TAG NAME 
    const userTag = tag
    //VIDEO SIZE
    const videoSize = metaData.videoSize 
    // DURATION
    const formattedDuration = metaData.videoDuration;
    const userVideoURL = storageURL
    // SET NEW FILE 
    const newFile = {
      content:"",
      title: userFileTitle,
      img: userFileImage,
      url: userVideoURL,
      id: folderFileId,
      folder_id: folderID,
      tag: userTag,
      duration: metaData.videoDurationString,
      storage_path_video: storagePathVideo,
      storage_path_audio: storagePathAudio,
      transcription:"",
      related_count: 0,
      video_size: videoSize
    };

    //UPDATE VIDEO
    const createResponse = await fetch(`http://localhost:3000/folder/file-create/${folderID}`,{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileToUpload: newFile, userId: currentUserId, currentStorageTake: userData.storage_take, videoSize: videoSize}),
    })
    if (createResponse.status === 200) {
      // Document exists, retrieve its data
      const StatusLog = await createResponse.json();
      console.log(StatusLog)
    }else if (createResponse.status === 400) {
      alert("Something went wrong, try refreshing the page !");
    }
    //UPDATE LOCAL SCREEN
    await fetchData()
    await fetchUserFolder()
  }else{
    alert("Clip is too long for free users ! If you want to save longer then 10 minutes clips, please upgrade your account !")
  }
  //HIDE POP UP LOGIC
  if (isLinkActive) { 
    setIsLinkActive(false)
  } else if (isUploadActive) {
    setIsUploadActive(false)
  };
};


//<*****************************DELETE*******************************>

//ARE YOU SURE MODAL
const [open, setOpen] = useState(false);

const handleOpen = () => setOpen(true);

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '1px solid #000',
  boxShadow: 24,
  p: 3,                          
};

//DELETE FOLDER
const handleDelete = async () => {
  if (currentuser) {
    // STRAGE REF FOLDER
    const videoRef = ref(storage,`"users"+ "/" +${currentuser.uid + "/" + folderElements.id}`)
    // USER UID
    const currentUserId = currentuser.uid;
    // FIRESTORE REF TO DELETE
    await deleteDoc(doc(db,"users",currentUserId,"File-Storage",folderID));
    console.log('Document successfully deleted');
    // DELETE FOLDER FROM STORAGE
    await deleteObject(videoRef).then(() => {
      console.log("Folder Deleted From Storage")
    }).catch((error) => {
      console.log(error)
    });
    // NAVIGATE BACK
    navigate("/memory");
  };
};
    
//EDIT FOLDER TITLE._________________________//
const handleTitleClick = () => {
  setIsEditing(true);
};

//INPUT VALUE HANDLE
const handleTitleChange = (e) => {
  setNewTitle(e.target.value);
};

//UPDATE AND SET NEW TITLE
const handleTitleBlur = async () => {
  //USER DATA & FIRESTORE REF
  const currentUserId = currentuser.uid;
  const urlID = id; 
  const docRef = doc(db, "users", currentUserId, "File-Storage",urlID);
  //NEW TITLE
  const editedTitle = newTitle;
  if (editedTitle != "") {
    await updateDoc(docRef, {
      title: editedTitle,
    })
    setIsEditing(false);
  } else {
    //IF STAYED EMPTY
    alert("No title were given !")
    await updateDoc(docRef,{
      title: "Empty",
    })
    setIsEditing(false);
  }
};

//ENTER LISTENER
const handleKeyUp = (e) => {
  if (e.key === 'Enter') {
    handleTitleBlur();
  }
};

//BACK BTN 
const navigateBack = () => {
  navigate("/");
};


return(

<Container fluid style={{width:"85%",justifyContent:"center",alignItems:"center"}} >
  <Row style={{width:"100%",marginRight:"auto",marginLeft:"auto",paddingTop:50,alignItems:"center",justifyContent:"space-between"}}>
    <Col >
    {isEditing ? (
          <input
            className="folder-input-change"
            type="text"
            value={newTitle}
            onChange={handleTitleChange}
            onKeyPress={handleKeyUp}
            autoFocus
          />
        ) : (
          <h2 className="first_bar-txt" onClick={handleTitleClick}>
            {newTitle}
          </h2>
        )}
        {isEditing ? 
          <h5 style={{opacity:0.8,paddingTop:5}}>Press Enter to OK</h5>:null
        }
    </Col>
   
      <Col className='col-auto' style={{border:"1px solid black"}} >
          <DesignServicesIcon/>
      </Col>
      <Col className='col-auto' style={{border:"1px solid black"}} >
          <DesignServicesIcon/>
      </Col>
 
  </Row>
  <Row>
    <Col>
    {userFile.map((file) => (
      <Link to={`/folder/${id}/${file.id}`}>
      <div key={file.id}>
        <FileCard imgSrc={file.img} title={file.title} tags={file.tag} video_size={file.video_size} />
      </div>
      </Link>
    ))}
    </Col>
  </Row>

<Row>
<Example handleUploadTrigger={createFile} setTitleInput={setFileTitle} setFileImageEXT={setFileImage} setExtractMetaEXT={setMetaData} setPassedAudioDataUrlEXT={setAudioFile} setVideoUrlEXT={setTrimmedVideoFile} />
</Row>
</Container>

)
}

export default Folder