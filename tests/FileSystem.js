var { describe, it, before } = self.Mocha
var { should, assert } = self.chai
should = should()

var { FileSystem, URLUtil, ReaderUtil } = self,
    fs = null

// TDD：测试驱动开发（Test-Driven Development）
// BDD：行为驱动开发（Behavior Driven Development）


before(function () {
    FileSystem.getInstance().then(f => fs = f)
})

describe('FileSystem', function () {

    // this.retries(4) // 失败后的重试次数
    // this.timeout(1000)  // 超时时间，默认2000

    describe('#getInstance()', function () {
        it('多次调用返回应该是同一个实例', function (done) {

            FileSystem.getInstance().then(function (f2) {
                assert(f2 === fs, '两次返回不是同一个实例')
                done()
            }, function (err) {
                done(err)
            }).catch(done)

        })
    })
})

describe('URLUtil', function () {
    describe('#isValidatedPath()', function () {
        it('文件或者目录不能包含\\:*?"<>|', function () {
            assert.equal(URLUtil.isValidatedPath('a\\c'), false)
            assert.equal(URLUtil.isValidatedPath('a:c'), false)
            assert.equal(URLUtil.isValidatedPath('a*c'), false)
            assert.equal(URLUtil.isValidatedPath('a?c'), false)
            assert.equal(URLUtil.isValidatedPath('a"c'), false)
            assert.equal(URLUtil.isValidatedPath('a>c'), false)
            assert.equal(URLUtil.isValidatedPath('a<c'), false)
            assert.equal(URLUtil.isValidatedPath('a|c'), false)
        })
    });
});