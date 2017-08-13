var { describe, it, before } = self.Mocha
var { should, assert } = self.chai

var { FileSystem, URLUtil, ReaderUtil } = self,
    fs = null

before(function () {
    FileSystem.getInstance().then(f => fs = f)
})

describe('FileSystem', function () {
    describe('#getInstance()', function () {
        it('多次调用返回应该是同一个实例', function (done) {
            FileSystem.getInstance().then(function (f2) {
                if (f2 === fs) {
                    done()
                } else {
                    done(new Error('实例不一致'))
                }
            }, function (err) {
                done(err)
            })
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