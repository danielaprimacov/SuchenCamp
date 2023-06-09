const CampGround = require('../models/campground');
const { cloudinary } = require('../cloudinary');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });


module.exports.index =async (req, res) => {
    const campgrounds = await CampGround.find({});
    res.render('campgrounds/index', { campgrounds });
};

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
};

module.exports.createCampground = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    const campground = new CampGround(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    campground.imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.author = req.user._id;
    await campground.save();
    req.flash('success', 'Erfolgreich einen neuen Campingplatz erstellt!');
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.showCampground = async (req, res) => {
    const campground = await CampGround.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if(!campground){
        req.flash('error', 'Campingplatz nicht gefunden');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', {campground});
};

module.exports.renderEditForm =async (req, res) => {
    const { id } = req.params;
    const campground = await CampGround.findById(id);
    if(!campground){
        req.flash('error', 'Campingplatz nicht gefunden');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', {campground});
};

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    const campground = await CampGround.findByIdAndUpdate(id, {...req.body.campground});
    const images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.imgs.push(...images);
    await campground.save();
    if(req.body.deleteImages){
        for(let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { imgs: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', 'Campingplatz erfolgreich aktualisiert!')
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.destroyCampground = async (req, res) => {
    const { id } = req.params;
    await CampGround.findByIdAndDelete(id);
    req.flash('success', 'Campingplatz erfolgreich gelöscht!');
    res.redirect('/campgrounds');
};



