const oxford = require("project-oxford");

const oxfordCli = new oxford.Client(process.env.oxford_key);
const face = oxfordCli.face;

const custom = data => {
    return {returnFaceId: true, data: oxford.makeBuffer(data)}
};

const makeErr = image => {
    return {image: image, cause: "The image has no face"};
};

module.exports.index = (req, res) => {
    return res.render('index');
};

module.exports.favico = (req, res) => {
    return res.status(204).end();
};

module.exports.validate = (req, res) => {
    const files = req.body;
    let image1;
    if (!files || !files.length) {
        return res.status(400).end();
    }
    return face.detect(custom(files[0]))
        .then(result => {
            if (!result.length) return Promise.reject(makeErr(1));
            image1 = result[0].faceId;
            return face.detect(custom(files[1]));
        })
        .then(result => {
            if (!result.length) return Promise.reject(makeErr(2));
            return face.verify([image1, result[0].faceId]);
        })
        .then(response => {
            let result = response;
            if (!result.isIdentical && result.confidence < 0.5) {
                result.confidence = 1 - result.confidence;
            }
            result.confidence = (result.confidence * 100).toFixed(2);
            res.json(result)
        })
        .catch(err => {
            console.log(err);
            if (err.cause) {
                return res.status(400).json(err);
            }
            return res.status(503).json(err);
        });
};
