const path = require('path')
const sinon = require('sinon')
const fs = require('fs')
const assert = require('assert')
const UserDataHandler = require('../src/data_handlers/user_data_handler')
const nock = require('nock')

const userDataHandler = new UserDataHandler()

describe('Test user data handler with nock', function () {
  let users
  let axiosStub
  let userEmailList
  let usersStub
  const pathToUsersJson = path.join(process.cwd(), 'data', 'users.json')
  const responseData = JSON.parse(fs.readFileSync(pathToUsersJson))
  const isMatchingAllSearchParamsStub = sinon.stub(userDataHandler, 'isMatchingAllSearchParams')
  usersStub = sinon.stub(userDataHandler, 'users')
  const findUsersStub = sinon.stub(userDataHandler, 'findUsers')

  beforeEach(async () => {
    nock('http://localhost:3000')
      .get('/users')
      .reply(200, responseData)

    await userDataHandler.loadUsers()
    users = userDataHandler.users
    userEmailList = userDataHandler.getUserEmailsList()
    numberOfUsers = userDataHandler.getNumberOfUsers()
  })

  describe('Loading users data from the server tests', function () {
    it('Method loading data from the server when the server responds successfully.', async function () {
      assert.deepEqual(users, responseData)
    })

    it('Method throws an error when failed to load users data', async () => {
      const errorMessage = 'Failed to load users data: Network Error'
      nock('http://localhost:3000').get('/users').replyWithError({
        message: 'Failed to load users data'
      })
      assert.rejects(userDataHandler.loadUsers(), errorMessage)
    })
  })

  describe('Find users tests', function () {
    this.beforeEach(() => {
      isMatchingAllSearchParamsStub.withArgs(sinon.match.any, sinon.match.any).returns(true)
      findUsersStub.restore()
    })

    it('Method returns an array of users matching the search parameters when users are loaded and search parameters are provided', async () => {
      findUsersStub.withArgs({}).returns(users)
      assert.deepEqual(
        userDataHandler.findUsers({}),
        responseData
      )
    })

    it('Method throws an error when no search parameters provided', async () => {
      const errorMessage = 'No search parameters provoded!'

      assert.throws(
        () => userDataHandler.findUsers(!{}),
        Error(errorMessage)
      )
      findUsersStub.restore()
    })

    it('Method throws an error when no users loaded', async () => {
      const errorMessage = 'No users loaded!'
      usersStub.value([])

      assert.throws(
        () => userDataHandler.findUsers({}),
        Error(errorMessage)
      )
    })

    it('Method throws an error when no matching users found', async () => {
      const errorMessage = 'No matching users found!'
      isMatchingAllSearchParamsStub.withArgs(sinon.match.any, sinon.match.any)
        .returns(false)

      assert.throws(
        () => userDataHandler.findUsers({}),
        Error(errorMessage)
      )
    })
  })

  describe('Checking a method for creating a string containing all user emails tests', function () {
    it('Method returns a string containing all user emails when users are loaded', async function () {
      const expectedEmailList = responseData.map(user => user.email).join(';')

      assert.equal(userEmailList, expectedEmailList)
    })

    it('Method throws an error when no users loaded', async function () {
      const errorMessage = 'No users loaded!'
      usersStub.value([])
      assert.throws(
        () => userDataHandler.getUserEmailsList(),
        Error(errorMessage)
      )
    })
  })


  it('Method returns the current number of users in the class instance', async function () {
    const expectedNumberOfUsers = responseData.length
    const numberOfUsers = userDataHandler.getNumberOfUsers()

    assert.equal(numberOfUsers, expectedNumberOfUsers)
  })

  describe('Checking if user matches all search parameters provided in searchParamsObject tests', function () {
    const validUser = { id: 1, name: 'Leanne Graham' }
    const invalidUser = { id: 12, name: 'Leanne Graham' };
    beforeEach(async () => {
      isMatchingAllSearchParamsStub.restore()
    })
    it('Is user matches all search parameters provided in searchParamsObject', async function () {
      assert.deepEqual(userDataHandler.isMatchingAllSearchParams(validUser, validUser), true)
    })

    it('Method returns false when any search parameter is not matching', async function () {
      assert.deepEqual(userDataHandler.isMatchingAllSearchParams(validUser, invalidUser), false)
    })
  })
})
