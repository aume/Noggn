import React, { useEffect, useRef, useState } from 'react';
import fire from './config/fire.js';
import TextField from '@material-ui/core/TextField';
import './teams.css'
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/analytics';

import {useAuthState} from 'react-firebase-hooks/auth';
import {useCollectionData} from 'react-firebase-hooks/firestore';

const firestore = fire.firestore();
const auth = fire.auth();
const analytics = fire.analytics();


function TeamPage(){
    const [showForm, setState] = useState(false);
    const [user,setUser] = useState('');
    const currUser = fire.auth().currentUser; 

    const userRef = fire.firestore().collection("Users");

    function getUser(){
        userRef.onSnapshot((querySnapshot) =>{
          let users = '';
          querySnapshot.forEach((doc)=>{
            if(doc.id == currUser.uid){
              users = doc.data().name;
            }
          });
          setUser(users);
        });
      }
    
      useEffect(() => {
        getUser();
      }, []);
    
    return(
      <div>
      <div>
      <h1>Welcome, {user}.</h1>
      <p>This is your dashboard where you can create and select Teams</p>
      {showForm ?  null : <button onClick = {() => setState(!showForm)}>New Team</button>}
      {showForm ? <button onClick = {() => setState(!showForm)}>Close</button> : null}
      {showForm ? <TeamForm/> : null}
      </div>
      </div>
      
    )
  }

  function TeamForm(){
    const teamsRef = firestore.collection('Teams');
    const [formValTeamName, setNameFormValue] = useState('');
    const [formValTeamUsers, setUsersFormValue] = useState('');

    const [currentTeams,setTeamName] = useState([]);
    const currUser = fire.auth().currentUser; 


    function getTeams(){ // retrieves all teams in DB
        teamsRef.onSnapshot((querySnapshot) =>{
          let teamNames = [];
          let teamAdmin = [];
          querySnapshot.forEach((doc)=>{

              teamNames.push([doc.data().teamName,doc.data().Admin]);

          });
          setTeamName(teamNames);
        });
      }
    
      useEffect(() => {
        getTeams();
      }, []);


    const addTeam = async (e) => {
    e.preventDefault();
    
    const {uid} = auth.currentUser;
    const expression = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([\t]*\r\n)?[\t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([\t]*\r\n)?[\t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
    let splitUsers = formValTeamUsers.split(",");
    let validEmails = true;
    let validTeamName = true;

    for(let i=0;i<splitUsers.length;i++){ //Correctly formats user emails to be pushed to DB array
      splitUsers[i] = splitUsers[i].trim();
      if(expression.test(splitUsers[i].toLocaleLowerCase()) == false){ //Validates each email string
        validEmails = false;
        break;
      }
    }
    
    // validates form details before uplaoding to DB, informs the user accordingly
    if(formValTeamName != '' && formValTeamUsers != '' && validEmails == true){
      for(let i=0;i<currentTeams.length;i++){
        console.log(currentTeams[i])
        if(currentTeams[i].includes(formValTeamName) && currentTeams[i].includes(uid)){ // checks if user has already created a team by this name
          validTeamName = false;
        }
      }
      if(validTeamName == true){
        await teamsRef.add({ // Pushes new team to DB
          Admin: uid,
          teamName : formValTeamName,
          splitUsers,
        })
        setNameFormValue('');
        setUsersFormValue('');
        alert("Team Created");
      }
      else{
        alert("You have already created a team with this name")
      }
    }
      else{
        alert("Please verify Fields")
      }
    }

      return(
          <div className = "teamForm">
              <form onSubmit={addTeam}>
                <TextField id="teamName" label="Team Name" variant="outlined" style={{width: '80%'}} value={formValTeamName} onChange={(e) => setNameFormValue(e.target.value)}/>
                <TextField id="users" label="Invite team members (email seperated by comma)" variant="outlined" style={{width: '80%'}} value={formValTeamUsers} onChange={(e) => setUsersFormValue(e.target.value)}/>
                <button type="submit" >Create Team</button>
              </form>
          </div>
      )
  }


  export default TeamPage;