1. on page load, i will hit a button that would start this whole process in the backend
2. Hit a query for ADO through which i get all the release work items that are upcoming
3. for each release query item fetch the work item details
curl -u :%ADO_PAT% "https://dev.azure.com/spglobal/ratingsproducts/_apis/wit/workitems/{WORK_ITEM_ID}?api-version=7.0"
4. Parse the JSON response to extract Custom.CMDBApplicationName and Custom.BuildID. print application name. build id is important for the next steps
5. for each build id, get its details
curl -u :%ADO_PAT% "https://dev.azure.com/spglobal/ratingsproducts/_apis/build/builds/{BUILD_ID}?api-version=7.0"
6. fetch build timelines
curl -u :%ADO_PAT% "https://dev.azure.com/spglobal/ratingsproducts/_apis/build/builds/{BUILD_ID}/timeline?api-version=7.0"
6. from build info and timeline checkout tasks, extract repository names. each build would have a pipeline url. each build could have multiple repositories. make sure to store that in 1 appropriate data structure. this data structure should start with the release work item id, map to all builds in that item id with pipeline url, mapped to repositories. we will also need to find and save pipeline id, and source branch along with the build id. not sure how to find those yet, but we should save them in this data strucutre as well. there will be additions to this data structure in the next steps. 
7. with the repo name look up a json file called spcom.json that stores a json that looks something like this
{
    appName: "",
    repositories: [
        {
            repoName: "",
            sva: "12321"
            sca: "asdasdfasdfasdfasdfasdfasdfasdfasdfsdf"
        }
    ]
}
add the sca and sva to the data structure. so we have a correlation between build, pipeline url, repos in it and their sca and sva. if repoName doesn't exist in this json then do not add them in this data structure. once you have the whole data structure print it out.
8. with this info, we will fire up all these builds on ADO without deploying them. we need to do this step because our tools will return data on the latest build on a particular repo. so we need to make sure that this particular build is the latest. there is a possiblity of a race condition but lets ignore that for now.
8. once the build is over, call mend scanner class which would
login to mend
curl -X POST -H "Content-Type: application/json" -d "{email, orgToken, userKey,}" https://api-spglobal.mend.io/api/v2.0/login
get jwt token
and use it to get scan details
/alerts/security?search=status:;equals:ACTIVE".
you will have to call these apis with insecure SSL bypass enabled
9. there would be other 2 other tools to call other than mend as well, but lets leave that for later. just make sure to design it in a way where other tools can be added easily. each tool would have different ways to fetch data and different outputs. so account for that as well
10. once you have the data from these tools, we will expose a few apis to - 
 - give a summary of counts for each release work item, for each build, for each repository, ccount of issues of each severity.
 - once user selects a release work item, give a detailed view
- then he would select build, so give that detailed view
- then he would select repository, so then he would see the issue details. at this point he will no longer see count.

