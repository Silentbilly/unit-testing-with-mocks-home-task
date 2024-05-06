const path = require('path')
const sinon = require('sinon')
const fs = require('fs')
const assert = require('assert')
const axios = require('axios')
const UserDataHandler = require('../src/data_handlers/user_data_handler')
const nock = require('nock')

describe('Test user data handler with nock', function () {
  let users
  let userDataHandler
  let axiosStub
  let userEmailList
  let usersStub
  const pathToUsersJson = path.join(__dirname, '..', 'data', 'users.json')
  const responseData = JSON.parse(fs.readFileSync(pathToUsersJson))
  userDataHandler = new UserDataHandler()
  const isMatchingAllSearchParamsStub = sinon.stub(userDataHandler, 'isMatchingAllSearchParams')
  usersStub = sinon.stub(userDataHandler, 'users')
  const findUsersStub = sinon.stub(userDataHandler, 'findUsers')

  beforeEach(async () => {
    axiosStub = sinon.stub(axios, 'get')
    axiosStub.withArgs('http://localhost:3000/users').resolves({ data: responseData })

    await userDataHandler.loadUsers()
    users = userDataHandler.users
    userEmailList = userDataHandler.getUserEmailsList()
    numberOfUsers = userDataHandler.getNumberOfUsers()
  })
  afterEach(() => {
    axiosStub.restore()
  })
  it('Uers list test', async function () {
    assert.deepEqual(users, responseData)
  })

  it('Handle error when loading users fails', async () => {
    const errorMessage = 'Failed to load users data: Network Error'
    axiosStub.withArgs('http://localhost:3000/users').rejects(new Error('Network Error'))

    assert.rejects(userDataHandler.loadUsers(), errorMessage)
  })

  it('Email list test', async function () {
    const expectedEmailList = responseData.map(user => user.email).join(';')

    assert.equal(userEmailList, expectedEmailList)
  })

  it('Number of users test', async function () {
    const expectedNumberOfUsers = responseData.length
    const numberOfUsers = userDataHandler.getNumberOfUsers()

    assert.equal(numberOfUsers, expectedNumberOfUsers)
  })

  it('isMatchingAllSearchParams test', async function () {
    isMatchingAllSearchParamsStub.withArgs(sinon.match.any, sinon.match.any)
      .returns(true)
    assert.equal(userDataHandler.isMatchingAllSearchParams({ /* user object */ }, { /* searchParamsObject */ }), true)
  })

  it('Handle error when finding users fails', async () => {
    const errorMessage = 'No search parameters provoded!'
    isMatchingAllSearchParamsStub.withArgs(sinon.match.any, sinon.match.any).rejects(new Error(errorMessage))

    assert.rejects(userDataHandler.findUsers(sinon.match.any), errorMessage)

    isMatchingAllSearchParamsStub.withArgs(sinon.match.any, sinon.match.any).returns(true)
  })

  it('Finding matching users', async () => {
    findUsersStub.withArgs(sinon.match.any).returns(users)
    assert.equal(
      userDataHandler.findUsers({}),
      responseData
    )
    findUsersStub.restore()
  })

  it('Handle error when no search parameters provided', async () => {
    const errorMessage = 'No search parameters provoded!'

    assert.throws(
      () => userDataHandler.findUsers(!{}),
      Error(errorMessage)
    )
    findUsersStub.restore()
  })

  it('Handle error when no users loaded', async () => {
    const errorMessage = 'No users loaded!'
    usersStub.value([])

    assert.throws(
      () => userDataHandler.findUsers({}),
      Error(errorMessage)
    )

    findUsersStub.restore()
    usersStub.restore()
  })

  it('Handle error when no matching users found', async () => {
    const errorMessage = 'No matching users found!'
    isMatchingAllSearchParamsStub.withArgs(sinon.match.any, sinon.match.any)
      .returns(false)

    assert.throws(
      () => userDataHandler.findUsers({}),
      Error(errorMessage)
    )
    findUsersStub.restore()
    isMatchingAllSearchParamsStub.restore()
  })
})
