//BY TGSAN
var rid ; 
var courseId ;
$(document).ready(function () {   
    var commitStatus = true;                            // 讨论讨论提交状态
    var loadPreStudyNoteState = true;                   // 查询学习记录
    var validateIsJumpChapterStatus = true;             // 验证跨章提交状态
    var saveDatabaseState = true;                       // 保存数据库状态
    var userId = $('#userId').val();                    // 用户ID
    var PCourseId = $("#PCourseId").val();              // 扩展表课程ID
    courseId = $("#courseId").val();                // 课程ID
    rid = $("#rid").val();                          // 招生ID
    var isJumpChapter = $('#isJumpChapter').val();      // 是否可以跨章
    var studentCount = $('#studentCount').val();        // 是否已报名
    var chapterId;                                      // 章ID
    var lessonId;                                       // 节ID
    var lessonVideoId;                                  // 小节id
    var videoId = $('#videoId').val();                  // 视频id
    var courseType = $('#courseType').val();            // 课程类型
    var $chapterObject;                                 // 记录点击的章对象
    var $videoObject;                                   // 记录点击的视频对象
    var currentPlayTime = "";                           // 保存视屏播放的当前时间
    var lessonQuestions = "";                           // 保存节次考题时间
    var popupExamInterval = "";                         // 弹题定时器
    var learnTime = $('#learnTime').val();              // 视频最后学习时间点
    var studiedId = "";                                 // 已学节次ID
    var databaseIntervalTime = 1000 * 60 * 5;           // 每5分钟保存数据库视频学习时间点
    var databaseInterval = "";                          // 每分钟保存数据库视频学习时间点定时器
    var cacheIntervalTime = 1000 * 60 * 3;              // 每3分钟保存缓存视频学习时间点
    var cacheInterval = "";                             // 每30秒保存缓存视频学习时间点定时器
    var totalStudyTimeInterval = "";                    // 累加学习视频时间
    var learningTimeRecordInterval = "";				//3秒钟记录5秒时间段
    var studyTotalTime = 0;                             // 视频学习总时间（秒）
    var videoSize;                                      // 视频大小
    var noteId = $("#noteId").val();					// 笔记id
    var watchState;                                     // 观看状态
    var playTimes = 0 ;									// 本次播放时长
    var studyStatus = $("#studyStatus").val();			//获得课程是否结束状态 1:已经完成 0：未完成
    var lessonPictures = "";							//视频弹图,时间点
    var preventPopupTest = false;					    // 阻止弹题标识
    var popupPicInterval = "";                          // 弹图定时器
    var tokenFlag = true;								//token是否通过验证标志
    var playRate = 1.0;                                 //视频速率
    var watchPointPost = "";
    initLoad(); 
    
    
    // 初始载入播放器 
    function initLoad() {
        showExploreTip();
    	hidePanel();
        // 检查当前章节视频列表中是否有包含此视频ID(防错)，#张立坤注
        if (checkedVideoIsExist(videoId)) {
            var video = $('#video-' + videoId);
            if (isSignUp()) {								// 已报名
            	// 从课程主页进入，弹出此提示，用于引导用户不再从此进入，#张立坤注
                validateIntoPoistion();
                // 直接当前章(节)
                validateIsJumpChapter(video, true);
            } else if (isNotSignUp() && isMinCourse()) {	// 未报名并且是微课，只能看第一个视频
                var firstVideo = $('.video:first');
                if (video.attr('_videoId') == firstVideo.attr('_videoId')) {
                    initPlayInfo(video);
                } else {
                    tmInitLoadingT(zLocale.only_try_watch_first_video, 5000);
                    setTimeout(reloadDefaultVideo, 3000);
                }

            } else {										// 未报名并且是进阶式课程，直接加载播放器
                initPlayInfo(video);
            }

        } else {
            // 设置默认播放视频
            defaultVideo();
        }

        // 前端渲染播放状态(图标：未看、播放未完成、播放完成)
        initVideoPlayState();

        
        initLearningEvent();

    }

    // 初始化视频播放状态
    function initVideoPlayState() {
        if (isSignUp()) {
            //  视频状态显示
            $('.isStudiedLesson').each(function (index, event) {
                var video_tmp = $(this).parents('li');
                var watchState = video_tmp.attr('watchState');
                var videoId_tmp = video_tmp.attr('_videoId');

                if (watchState != 1) {
                    var key = getCookieKey(videoId_tmp);
                    var _value = $.cookie(key);
                    if (isNotEmpty(_value)) {
                        var values = _value.split('_');
                        if (values[0] == 1) {
                            video_tmp.attr('watchState', 1);
                            $(this).removeClass().addClass('withborder_no_tip').addClass('fl').attr("tip", zLocale.click_video_can_submit);
                        } else {
                            setPlayerState.call(this);
                        }
                    } else {
                        setPlayerState.call(this);

                    }
                } else {
                    setPlayerState.call(this);

                }

                function setPlayerState() {
                    if (watchState != undefined && watchState != null && videoId_tmp != videoId && video_tmp.hasClass('video')) {
                        if (watchState == 1) {
                            $(this).removeClass().addClass('time_ico3').addClass('fl');
                        } else if (watchState == 2) {
                            $(this).removeClass().addClass('time_ico_half').addClass('fl');
                        }
                    }
                }

            });

            $(".time_ico_half").tmTip({color: "black", arrow: 'topMiddle', width: '100px'});
            $(".withborder_no_tip").tmTip({color: "black", arrow: 'topMiddle', width: '100px'});
        }
    }

    /**
     * 检查视频是否存在
     * @param videoId
     * @returns {boolean}
     */
    function checkedVideoIsExist(videoId) {
        if ($('#video-' + videoId).length == 1 && isNotEmpty(videoId)) {
            return true;
        }

        return false;
    }

    /**
     * 默认视频，最近一次观看的视频，如果从未看过，使用第一个
     */
    function defaultVideo() {
        var defVideo = $('#chapterList').find('li[watchstate!=1]').filter('.video').first();
        if (defVideo.length == 0) {
            defVideo = $('#chapterList').find('li').filter('.video').first();
        }
        initPlayInfo(defVideo);
    }

    /**
     *  当前章的前几章的所有节是否已学完
     */
    function getUnplayVideoCount(video) {
        return video.prevAll('[watchstate!=1]').filter('.video').length;
    }

    /**
     * 验证是否跨章学习
     * @param video
     */

    function validateIsJumpChapter(video, isFirstLoadVideo) {
        if (!validateIsJumpChapterStatus) {
            return;
        }
        if (isJumpChapter == 0) {

            //if (isFirstLoadVideo) {
                var unPlayCount = getUnplayVideoCount($('#chapter-' + video.attr('_chapterId')));

                if (unPlayCount == 0) {
                    initPlayInfo(video);
                } else {
                	var text="";
                	if (z_locale==1) {
                		text="本课程不能跨章学习,本章之前还有"+"【" + (unPlayCount) + "】"+'个视频没有看完';
						
					} else {
						 text='You are not allowed to skip chapters to learn and there are'+"【" + (unPlayCount) + "】"+ 'videos not finished before this chapter.';
					}
                	  tmInitLoadingT(text, 5000);
                	
                  
                    if (isFirstLoadVideo) {
                        window.setTimeout(reloadDefaultVideo, 3000);
                    }
                }
        } else {
            initPlayInfo(video);
        }
    }

    /**
     * 重新载入到默认视频
     */
    function reloadDefaultVideo() {
        tmInitLoadingT(zLocale.auto_jumpto, 3000);
        defaultVideo();
    }

    /**
     * 初始化跨章学习参数
     *
     */
    function initIsJumpChapterParams(video) {
    	//如果是已完成课程，优先级最高，不做判断，by wyj,2016/6/28
    	if (studyStatus == 1) {
    		initPlayInfo(video);
		}
    	// 没有报名的学生，只能学习第一章或者绪章
        var chapter = $('#chapter-' + video.attr('_chapterId'));
        //章节的课程视频 (video.attr("_chapternum")>1&& video.attr("_zhangNum")>0)||(video.attr("_zhangNum")>1)
        //章的课程视频   ((video.attr("_jieNum")>1&&video.attr("orderNumber")>0)||(video.attr("orderNumber")>1))
        if (isNotSignUp()){            	
        	if(video.attr("_zhangNum")>1){ //章>1弹窗提示
                notSignUpTip(zLocale.you_have_not_signed_up); 
                return;           		
        	}else{
        		if(video.attr("_jieNum")>1){//节>1弹窗提示
                    notSignUpTip(zLocale.you_have_not_signed_up); 
                    return;     
        		}else{
        			if(video.attr("_xjieNum")>1){    // 小节>1弹窗提示        		
            			notSignUpTip(zLocale.you_have_not_signed_up); 
                        return; 
                    }
        		}
        	}
        }
        if ($chapterObject && isJumpChapter == 0) {
            if (chapter.attr("_orderNumber") * 1 > $chapterObject.attr("_orderNumber") * 1 && isSignUp()) {
                validateIsJumpChapter(video);
            } else {
                initPlayInfo(video);
            }
        } else {
            // 没有报名的学生，只能学习第一章或者绪章
            var chapter = $('#chapter-' + video.attr('_chapterId'));
            if (isNotSignUp() && chapter.attr("_orderNumber") > $('#chapterList').find('.chapter:first').attr("_orderNumber")&&video.attr("_chapterNum")>1) {
                notSignUpTip(zLocale.you_have_not_signed_up);
                return;
            }
            initPlayInfo(video);
        }
    }

    /**
     * 初始化学习事件，与播放无关，用于页面上其它按钮单击事件监听
     */
    function initLearningEvent() {
        showTabs();				// 切换Tab，目录、笔记
        videoToggle();			// 视频列表切换(章节列表上)
        jiaoxuejihua();			// 教学计划弹出
//        learningTop();			// 学习排名弹出
        jiaoxuedaGang();		// 教学大纲弹出
        priase();				// 笔记点赞
        canclePriase();			// 取消点赞
        collection();			// 收藏
        collectionCancle();		// 取消收藏
        saveNote();				// 保存笔记
        notePlayTime();			// 获取记录笔记的时间(点击写笔记的编辑框时)
        showComment();			// 显示评论
        textAreaEvent();		// 监听评论输入框输入文本信息时，评论字数计数
        numberCheck();			// 评论计数
        addcomment();			// 添加评论
        getmoreComment();		// 获取更多评论
        notetitleswitch();		// 我的笔记、优秀笔记切换
        cancleShareNote();		// 取消共享笔记
        shareNote();			// 共享笔记
        showDelete();			// 自已的笔记，鼠标悬停时显示删除按钮
        deleteNoteContent();	// 删除笔记
        changePlayerType();		// 播放器切换(LeTV和老版播放器切换)
        intoCourseHomeEvent();	// 点击进入课程主页事件
        getCourseSpeakerList(); // 主讲人信息
        findNoteIdAndIsShareStatus();//笔记是否分享
    }

    /**
     * 初始化播放参数
     */
    function initPlayInfo($this) {
        recoveryDefault(); // 初始化默认参数
        $videoObject = $this;

        if (lessonId != $videoObject.attr('_lessonId')|| videoId != $videoObject.attr('_videoId')) {
            $('.catalogue').eq(1).attr('loadState', 0);
        }

        if (lessonId != $videoObject.attr('_lessonId') || videoId != $videoObject.attr('_videoId')) {
            $('.catalogue').eq(2).attr('loadState', 0);
        }

        chapterId = $videoObject.attr('_chapterId');
        lessonId = $videoObject.attr('_lessonId');
        videoId = $videoObject.attr('_videoId');
        var size = parseInt(timeToSec($videoObject.find('.time').text()));
        videoSize = isNaN(size) ? null : size;
        lessonVideoId = isNotEmpty($videoObject.attr('_lessonVideoId')) ? $videoObject.attr('_lessonVideoId') : null;

        $('.current_play').removeClass('current_play');
        $videoObject.addClass('current_play');
        $chapterObject = $('#chapter-' + chapterId);
        if (courseType == 1 || courseType == 4) { // 进阶式课程和海外课程
        	
            var lessonName = tmFilterTag($videoObject.attr('_name'));
            if(typeof($videoObject.attr('_order'))!="undefined"){
            
	            $("#lessonOrder").html($videoObject.attr('_order') + "、" + lessonName);
	            $("#lessonOrder").attr('title', $videoObject.attr('_order') + lessonName);
            }
            $('#chapterOrder').html(tmFilterTag($chapterObject.attr('_name')));
            $('#chapterOrder').attr("title",$('#chapterOrder').text());
            
        } else { // 微课程
            var lessonName = tmFilterTag($videoObject.attr('_name'));
            $("#lessonOrder").html(lessonName);
            $("#lessonOrder").attr('title', lessonName);
            $('#chapterOrder').html(tmFilterTag($videoObject.attr('_order')));
            $('#chapterOrder').attr("title",$('#chapterOrder').text());
        }
        //视频时长为0时观看无法记录进度，在此处限制观看视频时长为0的视频(用于限制初始化页面加载视频，手动切换时已前面限制，不会调用本方法）
        if($videoObject.attr("_videoSize")=="00:00:00"){
        	var p = "视频正在转码中，换个时间再来看看吧！";
        	if(z_locale!=1){
        		p ="Video is transcoding, another time to look at it .";
        	}
        	 $.tmDialog.alert({content:p,icon:"warm",fadeout:true,timeout:3,finish:function(ok){}});
        	 return;
        }
        prelearningNote();// 加载上次当前视频播放信息
        loadVideoPointerData();// 加载视频打点数据
        rollbackNote();
    }

    function recoveryDefault() {
        clearTimer();// 清除定时器
        commitStatus = true;// 讨论讨论提交状态
        studiedId = null;// 视频学习记录表Id
        studyTotalTime = 0;// 上一个视频累积观看时间
        currentPlayTime = null;// 当前视频播放时间
        videoSize = null;// 当前视频时长
        $("textarea").val("");
        loadPreStudyNoteState = true;// 查询学习记录
        validateIsJumpChapterStatus = true;// 验证跨章提交状态
        $('.videoDotWrap').empty();
    }

    /**
     * 加载上一次学习时间节点
     */
    function prelearningNote() {

        if (isSignUp()) {
            loadPreStudyNote();

            if (!isFirstLoad) {
                //loadBadgeName();
            //    getTopNo();
            } else {
                //upgrade();//徽章是否升级
            }

        }
        // 初始化播放列表状态
        initPlayListState();
        // 加载视频播放器
        initAblePlayer();
        // 设置下一节(第次初始化播放器时，绑定下一节按钮的事件)
        setNextLesson();
        // 限制没有报名的游客
        limitNotApply();
        
        //第一次进来没有token，提示
        if ($("#csrfToken").val() == "" || $("#csrfToken").val() == null || $("#csrfToken").val() == undefined && $.cookie('csrftoken') == null) {
        	$.tmDialog.alert({
				icon:"warm",
				title:zLocale.kindly_remind,
				content:zLocale.error_learning_remind,
				sureButton:zLocale.sure//确定按钮字
			});
        	tokenFlag = false;
        	changeWatchState(0);
		}

    }

    function loadPreStudyNote() {
        if (!loadPreStudyNoteState) {
            return;
        }
        loadPreStudyNoteState = false;
        $.ajax({
            type: 'post',
            url: jsonPath + '/learning/prelearningNote?time=' + getNowTime(),
            data: {
                rid: rid,
                studentCount: studentCount,
                lessonId: lessonId,
                PCourseId: PCourseId,
                chapterId: chapterId,
                lessonVideoId: lessonVideoId,
                userId: userId,
                videoId: videoId,
                studyStatus : studyStatus
            },
            success: function (data, textStatus, jqXHR) {
                loadPreStudyNoteState = true;
                studiedId = data.studiedLessonDto.id;
                watchState = data.studiedLessonDto.watchState;

                var values = $.cookie(getCookieKey(videoId));
                var serviceStudyTotalTime = isEmpty(data.studiedLessonDto.studyTotalTime) ? 0 : parseInt(data.studiedLessonDto.studyTotalTime);
                var serviceLearnTime = isNotEmpty(learnTime) ? learnTime : data.studiedLessonDto.learnTime; // 学习笔记跳转到学习页面指定时间
                if (isNotEmpty(values)) {
                    values = values.split('_');
                    var clientStudyTotalTime = parseInt(values[1]);

                    if (isEmpty(serviceStudyTotalTime) || serviceStudyTotalTime == 0 || isNaN(serviceStudyTotalTime) || serviceStudyTotalTime < clientStudyTotalTime) {
                        studyTotalTime = clientStudyTotalTime;
                        learnTime = isNotEmpty(learnTime) ? learnTime : values[2];
                        watchState = values[0];
                    } else {
                        studyTotalTime = serviceStudyTotalTime;
                        learnTime = serviceLearnTime;
                    }
                } else {
                    studyTotalTime = serviceStudyTotalTime;
                    learnTime = serviceLearnTime;
                }

                // 上次观看出现异常，手动提交一次
                if ($videoObject.find('.withborder_no_tip').length == 1) {
                    $videoObject.find('.withborder_no_tip').removeClass('withborder_no_tip').addClass('time_ico');
                    saveDatabaseIntervalTime();
                }

            },
            error: function () {
                loadPreStudyNoteState = true;
            }
        });
        watchPointPost = "";
    }


    /**
     * 更新视频累计观看时间进度条
     */
    var clearProgressbarboxtiper;
    var firstLoadShowProgressbarTip = true;

    function calculate() {
        var size = ((studyTotalTime / videoSize) * 100);
        return size > 100 ? 100 : size;
    }

    /**
     * 更新鼠标悬停章节标题时，提示进度信息
     */
    function updateProgressbar() {
        if (studiedId && videoSize) {
        	var size;
        	//token验证不通过的，进度条显示为0
        	if (tokenFlag != null && !tokenFlag ) {
				size = 0
			}else{
				size = calculate();
			}
            if (firstLoadShowProgressbarTip) {
            	//改变进度条长度
                $videoObject.find('.progressbar').animate({width: (size) + "%"},1000);
                //清除隐藏进度条定时器
                clearTimeout(clearProgressbarboxtiper);
                //隐藏进度条定时器
                clearProgressbarboxtiper = setTimeout(clearProgressbarboxtip, 3000);
                firstLoadShowProgressbarTip = false;
            } else {
                $videoObject.find('.progressbar').css({width: (size) + "%"}, 1000);
            }
            size = Math.round(size * 100) / 100;
            size = size > 95 ? 100 : size;
            $videoObject.find('.progressbar_box_tip span').text(zLocale.current_lesson_warch_time+'『' + (size) + '%』');
        }
    }

    /**
     * 鼠标悬停显示进度条
     */
    function hoverShowprogressbarBoxTip() {
        $('.current_play').die('mouseenter').live('mouseenter', function () {
            if ($('.progressbar_box_tip').css('display') == 'block') {
                return;
            }
            $('.progressbar_box_tip').fadeIn('fast');
            clearTimeout(clearProgressbarboxtiper);
        }).mouseleave(function () {
            if (!firstLoadShowProgressbarTip) {
                clearProgressbarboxtip();
            }
        });
    }

    /**
     * 隐藏进度条
     */
    function clearProgressbarboxtip() {
        $('.progressbar_box_tip').fadeOut('slow');
    }

    /**
     * 加载视频打点信息
     */
    function loadVideoPointerData() {
        if (isEmpty(videoSize))return;
        var params = {rid: rid};
        if (lessonVideoId) {
            params['lessonVideoId'] = lessonVideoId;
        } else {
            params['lessonId'] = lessonId;

        }
        params['userId'] = userId;
        $.ajax({
            async: true,
            type: 'post',
            url: basePath + '/json/learning/loadVideoPointerInfo?time=' + getNowTime(),
            data: params,
            success: function (data) {
                var videoThemes = data.lessonDtoMap.videoThemeDtos;
                var knowledgeCards = data.lessonDtoMap.knowledgeCardDtos;
                var allLessonQuestions = "";
                if (data.lessonDtoMap.lessonTestQuestionDtos) {
                    lessonQuestions = data.lessonDtoMap.lessonTestQuestionDtos.split('_')[0];
                    allLessonQuestions = data.lessonDtoMap.lessonTestQuestionDtos.replace('_', ',');
                }else {
                    lessonQuestions = "";
                }
                //弹图
                var pictureTimerAndUrls = data.lessonDtoMap.popupPictureDtos;

                var exam = {};
                if (isNotEmpty(allLessonQuestions)) {
                    var examTimers = allLessonQuestions.split(',');
                    $.each(examTimers, function (i) {
                        exam['timeNote'] = examTimers[i];
                        if (isNotEmpty(examTimers[i])) {
                            insertPointer('examDot', exam);
                        }
                    });
                }

                if (isNotEmpty(videoThemes)) {
                    $.each(videoThemes, function () {
                        insertPointer('themeDot', $(this)[0]);
                    });
                }

                if (isNotEmpty(knowledgeCards)) {
                    $.each(knowledgeCards, function () {
                        insertPointer('cardDot', $(this)[0]);
                    });
                }
                //弹图
                var picture = {};
                lessonPictures = "";
                if(isNotEmpty(pictureTimerAndUrls)){
                	$.each(pictureTimerAndUrls,function(picKey,picUrl){
                		lessonPictures += picKey+",";
                		picture['timeNote'] = picKey;
                		picture['picUrl'] = picUrl;
                		if(isNotEmpty(picUrl)){
                			insertPointer('pictureDot',picture);
                		}
                	});
                }
                
                

                showTheme();
                showCard();
                showExam();
                showPicture();
                suspendTime();// 视频弹题
            },
            error: function () {
                commitStatus = true;
            }
        });
    }

    /**
     * 在同一时间段是否已经存在视频打点
     */
    function inTimeExistPointerCotainer(time) {
    	if (time.indexOf(":") < 0) {
    		return $('#videoDotContainer-' + time).length == 1 ? $('#videoDotContainer-' + time) : false;
    	}
        return $('#videoDotContainer-' + timeToSec(time)).length == 1 ? $('#videoDotContainer-' + timeToSec(time)) : false;
    }

    /**
     * 是否存在视频打点
     * @param pointerClass
     * @returns {*}
     */
    function isNotExistPointer(pointerClass, timeNote) {
        var videoDotCotainer = inTimeExistPointerCotainer(timeNote);
        var isExistCotainer = videoDotCotainer.length == 1 ? true : false;
        var isExistPointer;
        if (isExistCotainer) {
            isExistPointer = videoDotCotainer.find('.' + pointerClass);
            if (isExistPointer.length == 1) {
                return isExistPointer;
            }
        }
        return false;
    }

    /**
     * 插入视频打点
     * @param pointerType examDot.试题打点 themeDot.主题打点 cardDot.知识卡打点 pictureDot.视频弹图
     */
    function insertPointer(pointerClass, data) {
        var pointer = $('<span class="videoDot"/>');
        //判断是否存在打点
        var videoDotCotainer = inTimeExistPointerCotainer(data.timeNote);
        var isExistCotainer = videoDotCotainer.length == 1 ? true : false;
        pointer.addClass(pointerClass);
        if (isExistCotainer) {
            var existPointer = isNotExistPointer(pointerClass, data.timeNote);
            if (existPointer.length == 1) {
                pointer = existPointer;
            }
        }

        var tip;
        pointer.attr('id', pointerClass + '_' + data.id);
        switch (pointerClass) {
        	case 'pictureDot':
        		tip = zLocale.video_popup_picture;
        		pointer.attr('timeNote',data.timeNote);
        		pointer.attr('picUrl',data.picUrl);
        		pointer.attr('title',tip);
        		break;
            case 'examDot':
                tip = zLocale.video_tanti;
                pointer.attr('timeNote', data.timeNote);
                pointer.attr('title', tip);
                break;
            case 'themeDot':
                tip = zLocale.video_topic;
                pointer.attr('opid', data.id);
                pointer.attr('timeNote', data.timeNote);
                pointer.addClass('showTheme');
                pointer.attr('content', data.content);
                break;
            case 'cardDot':
                pointer.attr('opid', data.id);
                pointer.attr('_title', data.title);
                pointer.attr('content', data.content);
                tip = zLocale.video_knowcard;
                break;
        }
        var left_ = 0;
        if ("pictureDot"==pointerClass) {
        	left_ = ((parseInt(data.timeNote) / parseInt(videoSize)) * 100);
		}else{
			left_ = ((parseInt(timeToSec(data.timeNote)) / videoSize) * 100);
		}
        left_ = left_ > 99 ? 99 : left_;
        if (isExistCotainer) {
        	//是否存在视频打点
            if (!isNotExistPointer(pointerClass, data.timeNote)) {
            	if("pictureDot"==pointerClass){
            		videoDotCotainer.prepend(pointer);
            	}else{
            		videoDotCotainer.append(pointer);
            	}
            }
        } else {
            videoDotCotainer = $('<div class="videoDotContainer"/>');
            videoDotCotainer.attr('id', 'videoDotContainer-' + timeToSec(data.timeNote));
            videoDotCotainer.css({left: left_ + '%'});
            videoDotCotainer.append(pointer);
            $('.videoDotWrap').append(videoDotCotainer);
        }

    }

    function showTheme() {
        $('.showTheme').die('click').live('click', function (event) {
            var content = $(this).attr('content');
            var opid = $(this).attr('opid');
            showeThemeTip(content, 'themeDot', opid, tm_posXY(event));
        });
    }

    function showeThemeTip(content, typeClass, opid, position) {
        $('.dotCardWrap').find('.dotCardInfoDetail').text(content);
        $('.dotCardWrap').find('.dotInfo_editBtn').addClass(typeClass + "Edit").attr('opid', opid);
        $('.dotCardWrap').find('.dotInfo_delBtn').addClass(typeClass + "Del").attr('opid', opid);
        if(position.x < 120){
            $('.dotCardWrap').css({'left': position.x - 30, 'bottom': 50});
            $(".dotCardArrow").hide();
        }else{
            $('.dotCardWrap').css({'left': position.x - 120, 'bottom': 50});
        }
        $('.dotCardWrap').fadeIn('fast');
        hideTip();
    }

    function showCard() {
        $('.cardDot').die('click').live('click', function (event) {
            var opid = $(this).attr('opid');
            var title = $(this).attr('_title');
            var content = $(this).attr('content');
            showeCardTip(title, content, 'cardDot', opid, tm_posXY(event));
        });
    }

    function showeCardTip(title, content, typeClass, opid, position) {
        var titleObj = $('<span>'+zLocale.subject+'</span>');
        var contentObj = $('<span>'+zLocale.content+'</span>');
        $('.dotCardWrap02').find('.dotCardInfoDetail').eq(0).html(titleObj);
        $('.dotCardWrap02').find('.dotCardInfoDetail').eq(1).html(contentObj);
        $('.dotCardWrap02').find('.dotCardInfoDetail').eq(0).append(title);
        $('.dotCardWrap02').find('.dotCardInfoDetail').eq(1).append(content);
        $('.dotCardWrap02').find('.dotInfo_editBtn').addClass(typeClass + "Edit").attr('opid', opid);
        $('.dotCardWrap02').find('.dotInfo_delBtn').addClass(typeClass + "Del").attr('opid', opid);
        if(position.x < 120){
            $('.dotCardWrap02').css({'left': position.x - 30, 'top': -67});
        }else{
            $('.dotCardWrap02').css({'left': position.x - 120, 'top': -67});
        }
        $('.dotCardWrap02').fadeIn('fast');
        hideTip();
    }

    function hideTip() {
        $('.dotCardWrap,.dotCardWrap02').die('click').live('mouseleave', function () {
            $(this).fadeOut();
        }).live('mouseenter', function () {
        });
    }

    /**
     * 节视频列表切换videoToggle
     */
    function videoToggle() {
        $('.video').die('click').live('click', function () {
            var $this = $(this);
            hideQrcode();
            if (isEmpty($this.attr('_videoId'))) {
                $.tmDialog.alert({
                    content: zLocale.not_upload_video,
                    icon: "warm", 
                    fadeout: true, 
                    timeout: 3,
                    sureButton:zLocale.sure,//确定按钮字
            		cancleButton:zLocale.cancel,//取消按钮字
                    finish: function (ok) {
                    }
                });
                return;
            }

            if (videoId == $this.attr('_videoId')) {
                ablePlayerX('mediaplayer').seek(0);
                return;
            }

            //视频时长为0时观看无法记录进度，在此处限制观看视频时长为0的视频
            if($this.attr("_videoSize")=="00:00:00"){
            	var p = "视频正在转码中，换个时间再来看看吧！";
            	if(z_locale!=1){
            		p ="Video is transcoding, another time to look at it .";
            	}
            	 $.tmDialog.alert({content:p,icon:"warm",fadeout:true,timeout:3,finish:function(ok){}});
            	 return;
            }
            
            if (limitWatchTime()) {
            	//如果学生该课程为已结束课程，则不做数据库记录，在saveDatabaseIntervalTime里面做控制，by wyj，2016/6/4
        		saveDatabaseIntervalTime(1, $this);
            }
            vId = $this.attr('_videoId');
        });
    }

    /**
     * 初始化播放列表状态
     */
    var preVideo;

    function initPlayListState() {
        // 去掉上一个播放状态的样式
        if (preVideo) {
            if (isSignUp()) {
                if (preVideo.attr('watchState') == 1) {
                    preVideo.find('.time_ico').removeClass('time_ico').addClass('time_ico3');
                } else if (preVideo.attr('watchState') == 2) {
                    preVideo.find('.time_ico').unbind('hover');
                    preVideo.find('.time_ico').removeClass('time_ico').addClass('time_ico_half');
                    $(".time_ico_half").tmTip({color: "black", arrow: 'topMiddle', width: '100px'});
                } else {
                    preVideo.find('.time_ico').removeClass('time_ico').addClass('time_ico1');
                }

                preVideo.find('.progressbar_box_tip').remove();
                preVideo.find('.progressbar_box').remove();

            } else {
                preVideo.find('.time_ico').removeClass('time_ico').addClass('time_ico1');
            }

        }

        $videoObject.find('.time_ico3,.time_ico1,.time_ico_half').unbind('hover');
        $videoObject.find('.time_ico3,.time_ico1,.time_ico_half').removeClass().addClass('time_ico').addClass('fl');
        preVideo = $videoObject;

       if (isSignUp()) {
           var progressbar_box = $('<div class="progressbar_box"><div class="progressbar"></div></div><div class="progressbar_box_tip"><span>'+zLocale.history_loading+'</span></div>');
           progressbar_box.appendTo($videoObject);
           //显示观看累计时间正在加载
           setTimeout(updateProgressbar, 3000);
           //显示累计观看时间
           hoverShowprogressbarBoxTip();
       }
    }

    /**
     * 是否报名
     */
    function isSignUp() {
        return studentCount == 1;
    }

    function isNotSignUp() {
        return isSignUp() ? false : true;
    }

    /**
     * 从课程主页进入，弹出此提示，用于引导用户不再从此进入，#张立坤注
     */
    function validateIntoPoistion() {
        if ($('#intoType').val() == 2) {
            $('#IntoTypeTip').show();
        }
    }

    var isFirstLoad;

    /**
     * 初始化播放器
     */
    function initAblePlayer() {
        firstLoadShowProgressbarTip = true;

        // 计算当前播放视频坐标，目录列表自动滚动到可见位置(是否是中间，待确认)，#张立坤注
        var xy = $videoObject.offset();
        if (isEmpty(isFirstLoad) && xy) {
            $('.catalogue_ul1').animate({scrollTop: xy.top - $('#Tabs_1').find('ul').height()}, 1000);
            reSizePlayer(getPlayerSize().mW, getPlayerSize().mh);
            isFirstLoad = true;
        }
        
        $("#mediaplayer").remove();//删除视频元素
        $("#mediaplayer_parent").html("<div id='mediaplayer'></div>");//重新添加存放视频的div
        $("#mediaplayer").css({width:getPlayerSize().mW,height:getPlayerSize().mh});
        // 针对本学期运行的复旦军理课限制弹幕使用
        var commentToggle = (courseId == 2000624 ? false : true) ;
        //JIANGJH 2015/9/14
		if($('#schoolId').val() == -1){
			commentToggle = false;
		}
		//END JIANGJH
        // 加载播放器代码
        $("#mediaplayer").Ableplayer({
//            host: "http://base1.zhihuishu.com/able-commons/",
            id: videoId,
//            width: getPlayerSize().mW,
//            height: getPlayerSize().mh,
//            hide: true,
//            primary: 'flash',
//            startparam: 'start',
//            autostart: true,
//            adtime: 10,
//            userid: userId,
//            username: userName,
//            enablecommentsend: commentToggle,
//            enablecommentshow: commentToggle,
//            image: '',
////            defaltplayertype: $('#changePlayerType').attr('type')  // 配置初始使用的播放器类型. 默认值:"1"   乐视播放器:"2"  jwplayer播放器:"3"  , 如果乐视没有转码完成或者上传失败,就自动使用jwplayer播放
//            enableChangePlayerButton: true //是否显示 切换播放器 按扭 默认false
            control: {nextBtn: true},
            videoTitleTxt: $("#lessonOrder").attr('title') || ""
        }, {
        	onReady: function () {// 初始化完成
        		recordPlayInfo() ;
        	}, onComplete: function () {// 播放完成
                totalStudyTime(), clearTimer(), saveCacheIntervalTime(), saveDatabaseIntervalTime();
            }, onPause: function () {
                clearTimer(), saveCacheIntervalTime();// 自动保存一次缓存
            }, onPlay: function () {
            	$("#codehint_box").hide();
                totalStudyTimeAndTimingDataBaseEvent(), suspendTime(), getVideoSize();
                //console.log("onPlay");
            }, playbackRate:function (rate) {
        	    playRate = rate > 1.5 ? 1.5 : rate;
            }, playerNext: function () {
                $('.tm_next_lesson').click();
                saveDatabaseIntervalTime();
            }
        });
        vId = videoId;
    }

    /**
     * 上报播放统计信息
     */
    function recordPlayInfo() {
    	// 与主业务逻辑无关，异常捕获掉 
    	try {
    		var chapterName = "" ;
    		if($chapterObject && $chapterObject.length > 0) {
    			var $title = $chapterObject.find(".catalogue_title") ;
    			if($title && $title.length > 0) chapterName = $title.text() ;
    		}
    		// 向视频组发送消息，用于统计
    		ablePlayerX("mediaplayer").addCourseInfo({
    			courseId:courseId,
    			courseName:$("#courseName").val(), 
    			recruitId:rid,
    			chapterId:chapterId,
    			chapterName:chapterName,   
    			userId:userId,
    			userName:userName, 
    			schoolId:$("#schoolId").val()
    		});
    	} catch(e) {
    		if(console && console.log) console.log(e) ;
    	}
    }

    function changePlayerType() {
        $('#changePlayerType').live('click', function () {
            var $this = $(this);
            var type = $this.attr('type');
            $this.attr('type', (type == 2) ? 3 : 2);
            learnTime = currentPlayTime;

            try {
                $.Ableplayer.changePlayerType($this.attr('type'), function () {
                    clearTimer(), initAblePlayer();
                });
            } catch (e) {
                //alert(e);
            }
        });

    }

    function getVideoSize() {
//        var videoSize1 = parseInt(ablePlayerX("mediaplayer").getDuration());
//
//        if (isEmpty(videoSize) || videoSize == 0 || (isNotEmpty(videoSize) && $.isNumeric(videoSize1) && videoSize != 0 && videoSize != videoSize1)) {
//            videoSize = videoSize1;
//            var params = {'videoTimeDto.videoId': videoId, 'videoTimeDto.videoTime': videoSize, 'courseId': courseId};
//            $videoObject.find('.time').text(tm_hhmmss(videoSize));
//            $.ajax({async: true, type: 'post', url: jsonPath + '/lessonVideo/updateVideoTime?v=' + getNowTime(), data: params});
            loadVideoPointerData();// 加载视频打点数据
//        }
    }

    /**
     * 限制微课程观看视频，未报名用户只能观看视频的三分之一
     */
    function limitWatchTime() {
        if (isNotSignUp() && isMinCourse()) {
            stopPlayVideo();	//停止试看
            $(".entirePayDiv").fadeIn("slow");
            return false;
        }

        return true;
    }

    function isMinCourse() {
        return courseType == 2;
    }

    //开始累计观看时间
    function totalStudyTime() {
    	//tokenFlag验证不通过的，定时器时间不增加
    	if (tokenFlag != null && !tokenFlag) {
    		studyTotalTime = 0;
    		palyTimes = 0;
		}
    	if (studyStatus != null && studyStatus == 1){
    		
    	}else{
    		studyTotalTime += (5 * playRate);	// 定时器周期是5秒，所以每次加5, 如果本次5秒内的视频播放速率是1.5，则要乘于1.5，如果是0.5则乘于0.5
            playTimes += 5 ;		// 累计本次播放时长，用于计算招生纬度累计观看时长
    	}
        updateProgressbar();	// 更新进度
    }
    //记录观看时间段
    function learningTimeRecord(){
    	getNoteTime();
        var time = currentPlayTime==null?'00:00:00':currentPlayTime;
        var hour = currentPlayTime.split(':')[0];
        var min = currentPlayTime.split(':')[1];
        var sec = currentPlayTime.split(':')[2];
        var currentSec = Number(hour*3600) + Number(min*60) + Number(sec);
        var currentPoint = parseInt(currentSec/5)+2;
        // var key = getWatchPointCookieKey(videoId);
        var cookValue = (watchPointPost == null || watchPointPost == "") ? "0,1," : watchPointPost + ',';
        watchPointPost = cookValue+currentPoint;
        // $.cookie(key, cookValue+currentPoint, { expires: 1 });
    }
    /**
     *  开始统计学习时间和绑定定时保存数据库事件
     */
    function totalStudyTimeAndTimingDataBaseEvent() {
        if (isSignUp()) {
        	// 获取上次学习时间，进度条自动进到指定时间位置
            if (isNotEmpty(learnTime)) {
                var date = new Date("January 1,1970 " + learnTime);
                console.log("跳转到上次播放时间点："+(date.getTime() + (1000 * 3600 * 8)) / 1000);
                ablePlayerX("mediaplayer").seek((date.getTime() + (1000 * 3600 * 8)) / 1000);	// 播放器自动加载指定进度函数
                learnTime = "";
            }
            // 控制只有第一次点击播放(指章节列表处点击)当前视频时启动计时器
            if (isEmpty(totalStudyTimeInterval)) {
                startTotalTimer();
            }
        }

    }

    /**
     * 开始定时器
     */
    function startTotalTimer() {
    	// 每1990ms执行一次learningTimeRecord
    	learningTimeRecordInterval = setInterval(learningTimeRecord, 1990);
    	// 每4990ms执行一次totalStudyTime
        totalStudyTimeInterval = setInterval(totalStudyTime, 4990);
        // 定时将学习进度写入缓存(暂定3分钟)
        cacheInterval = setInterval(saveCacheIntervalTime, cacheIntervalTime);
        // 定时将学习进度写入数据库(暂定5分钟)
        databaseInterval = setInterval(saveDatabaseIntervalTime, databaseIntervalTime);

    }

    /**
     * 清除定时器
     */
    function clearTimer() {
    	window.clearInterval(learningTimeRecordInterval);
        window.clearInterval(totalStudyTimeInterval);
        window.clearInterval(cacheInterval);
        window.clearInterval(databaseInterval);
        totalStudyTimeInterval = null, cacheInterval = null, databaseInterval = null,learningTimeRecordInterval = null;
    }


    /**
     * 下一节
     */
    var nextVideo;

    function nextLesson() {
        $('.tm_next_lesson').die('click').live('click', function () {
            nextVideo.click();
            $('.catalogue:first').click();

        });
    }

    /**
     * 设置下一个节
     */
    function setNextLesson() {
        var videoList = $('.video');
        if (videoList.length == 1) {
            $('.tm_next_lesson').hide();
            return;
        }

        nextVideo = $videoObject.nextAll('.video:first');

        if (isEmpty(nextVideo)) {
            $('.tm_next_lesson').hide();
        } else {
            $('.tm_next_lesson').show();
            $('.tm_next_lesson').attr('title', zLocale.next_lesson+"：" + nextVideo.attr('_order') + "、" + nextVideo.attr('_name'));
        }

        nextLesson();//绑定下一节事件
    }

    /**
     * 未报名提示
     */
    function notSignUpTip(title) {
        $.tmDialog.confirm({
            content: title,
            icon: "warm",
            callback: function (ok) {
                if (ok) {
                    location.href = basePath + "/apply/signup/" + courseId;
                }
            }
        });
    }

    /**
     * 限制未报名的不能进行笔记保存
     */
    function limitNotApply() {
        if (isNotSignUp()) {// 没有报名的，禁用笔记，讨论
            $(".cnotes_submit,.allTextarea").attr('disabled', true);
        }
    }


    /**
     * 视频、资料、笔记、讨论列表切换
     */
    function showTabs() {
        var preID = 1;
        $('.tabTitle').die('click').live('click', function () {
            var tID = parseInt($(this).attr('tid'));
            var tTabTitle = $(this);
            var tTabs = $('#Tabs_' + tID);
            var preTabs = $('#Tabs_' + preID);

            if (preID != tID) {
                var preTab = tTabTitle.siblings().filter('.select').find('a');
                preTab.addClass(preTab.attr('class') + "_white");
                tTabTitle.addClass('select').siblings().removeClass('select');

                var curTab = tTabTitle.find('a'), classStyle = curTab.attr('class');
                classStyle = classStyle.substring(0, classStyle.lastIndexOf('ico') + 3);
                curTab.removeClass().addClass(classStyle);

                preTabs.fadeOut('fast');
                tTabs.fadeIn('fast');
                preID = tID;
            }

            var loadState = tTabs.attr('loadState');
            if ((loadState == 0 || !loadState) && tID == 2) {
                // 已经报名的
                if (isSignUp()) {
                    if ($("a[name='mynotetitle']").attr("class") == "cur") {

                        findPersonNote();
                    } else {
                        findExecnotes();
                    }
                }
                tTabs.attr('loadState', 1);
            }
        });
    }

    //检查是否存在优秀笔记
    function checkIfHasExecNote() {
    	
        var data = {"lessonId": lessonId, "lessonVideoId": lessonVideoId, "courseId": courseId, userId: userId};
        $.ajax({
            type: "post",
            data: data,
            url: basePath+ "/json/noteContent/findIfHasExecNoteOfLesson?v=" + getNowTime(),
            success: function (data) {
                $(".tabhint_ico").remove();
                if (data.noteContentCount > 0) {
                    $(".tabTitle[tid='2']").append($("<span class='tabhint_ico'></span>"));
                }
            }
        });

    }

    //分享笔记
    function shareNote() {
        $(".shareico_gray").die("click").live("click", function () {
            if (!commitStatus) {
                return;
            }
            commitStatus = false;
            var $this = $(this);
            $.ajax({
                type: "post",
                data: {"noteId": noteId, userId: userId},
                url: basePath + "/json/learning/shareNote?v=" + getNowTime(),
                success: function (data) {
                    $this.removeClass("shareico_gray").addClass("shareico_green").attr("title", zLocale.note_shared)
                    commitStatus = true;
                }
            });

        });
    }

    //取消 分享笔记
    function cancleShareNote() {
        $(".shareico_green").die("click").live("click", function () {
            if (!commitStatus) {
                return;
            }
            commitStatus = false;
            var $this = $(this);
            $.ajax({
                type: "post",
                data: {"noteId": noteId, userId: userId},
                url: basePath + "/json/learning/cancleShareNote?v=" + getNowTime(),
                success: function (data) {
                    $this.removeClass("shareico_green").addClass("shareico_gray").attr("title", zLocale.share_your_notes)
                    commitStatus = true;
                }
            });
        });
    }

    //初始化笔记状态
    function rollbackNote() {
        $(".notetab_box").find("a").each(function () {
            $(this).attr("isload", "0");
        });
        $("a[name='mynotetitle']").addClass("cur");
        $("a[name='execnotetitle']").removeClass("cur");
        $(".execnotecontent").css("display", "none");
        $(".mynotecontetn").css("display", "block");
        if ($(".select").attr("tid") == "2") {
            findPersonNote();
        }
        checkIfHasExecNote();
    }

    /**
     * 查询我的笔记信息
     *
     */
    function findPersonNote() {
        var data = {
            "lessonId": lessonId,
            "lessonVideoId": lessonVideoId,
            "noteId": noteId,
            "courseId": courseId,
            userId: userId
        };
        $('.noteContentul').empty();
        $('.noteContentul').append('<div class="loading_div"></div>');
        $.ajax({
            type: "post", data: data, url: basePath + "/json/learning/findspNote?v=" + getNowTime(),
            success: function (data) {
                noteId = data.noteId;
                if (data.contentDtos.length == 0) {
                    $(".noteContentul").html('<div class="no-note"></div>');
                } else {
                    $(".noteContentul").html(transIntoHtml(data, 0));
                    $('.noteContentul').scrollTop($('.noteContentul')[0].scrollHeight);

                }

            }
        });
    }

    function findExecnotes() {
        var data = {"lessonId": lessonId, "lessonVideoId": lessonVideoId, "chapterId": chapterId};
        $('.execnoteContentul').html('<div class="loading_div"></div>');
        $.ajax({
            type: "post", data: data, url: basePath + "/json/learning/findcourseExecNote?v=" + getNowTime(),
            success: function (data) {

                if (data.contentDtos.length == 0) {
                    $(".execnoteContentul").html('<div class="no-note"></div>');
                } else {
                    $(".execnoteContentul").html(transIntoHtml(data, 1));
                }

            }
        });
    }

    //笔记内容切换
    function notetitleswitch() {
        $("a[name='mynotetitle']").die("click").live("click", function () {
            var $this = $(this);
            if ($this.attr("class") != "cur") {
                $this.addClass("cur");
                $("a[name='execnotetitle']").removeClass("cur");
                $(".mynotecontetn").css("display", "block");
                $(".execnotecontent").css("display", "none");

                $(".shareico_green,.shareico_gray").css("display", "block");
            }
        });
        $("a[name='execnotetitle']").die("click").live("click", function () {

            var $this = $(this);
            if ($this.attr("class") != "cur") {
                $this.addClass("cur");

                $("a[name='mynotetitle']").removeClass("cur");
                $(".tabhint_ico").remove();
                $(".mynotecontetn").css("display", "none");
                $(".execnotecontent").css("display", "block");

                $(".shareico_green,.shareico_gray").css("display", "none");
            }

            if ($this.attr("isload") == 0) {

                findExecnotes();
                $this.attr("isload", 1);
            }
        });

    }

    //删除笔记
    function deleteNoteContent() {
        $(".learnotelist_del").die("click").live("click", function () {
            var $this = $(this);
            var $noteContent = $this.parents(".noteContent");
            var noteContentId = $noteContent.attr("_notecontentid");
            var noteId = $noteContent.attr("_noteid");
            var type = $noteContent.attr("_type");
            //删除自己笔记
            if (type == "0") {
                $.tmDialog.confirm({
                	title:zLocale.tip,
                	sureButton: zLocale.sure,
                    cancleButton: zLocale.cancel,
                    target: $this,
                    content: zLocale.sure_dele_note, 
                    showBtn: true, 
                    icon: "question",
                    
                    fadeout: true, callback: function (ok) {
                        if (ok) {
                            $.ajax({
                                type: "post", data: {"noteContentId": noteContentId, "noteId": noteId,"lessonId":lessonId,"lessonVideoId":lessonVideoId},
                                url: basePath + "/json/learning/deleteNoteContent?v=" + getNowTime(),
                                success: function (data) {
                                    if (data.ajax == true) {
                                        $noteContent.slideUp("fast", function () {
                                            $(this).remove()
                                        });
                                    } else {
                                        alert(zLocale.del_faild);
                                    }
                                }
                            });
                        }
                    }
                });
            }
            //删除收藏笔记
            if (type == "1") {
                $.tmDialog.confirm({
                    content: zLocale.del_collection_ote,
                    showBtn: true, icon: "question",
                    sureButton: zLocale.sure,
                    cancleButton: zLocale.cancel,
                    fadeout: true,
                    callback: function (ok) {
                        if (ok) {
                            $.ajax({
                                type: "post", data: {"noteContentId": noteContentId, "noteId": noteId},
                                url: basePath + "/json/learning/deleteCollNoteContent?v=" + getNowTime(),
                                success: function (data) {
                                    if (data.ajax == true) {
                                        $noteContent.remove();
                                    } else {
                                    	alert(zLocale.del_faild);
                                    }
                                }
                            });
                        }
                    }
                });

            }

        });
    }

    //显示隐藏删除的按钮
    function showDelete() {
        $(".noteContent").die("mouseover").live("mouseover", function () {
            $(this).find(".learnotelist_del").css("display", "block");
        });
        $(".noteContent").die("mouseout").live("mouseout", function () {
            $(this).find(".learnotelist_del").css("display", "none");
        });
    }

    function transIntoHtml(data, num) {
        var ncHTML = "";
        for (var i = 0; i < data.contentDtos.length; i++) {
            if (num == 0) {
                ncHTML += '<li class="noteContent" _userId="' + data.contentDtos[i].userId + '" _type="' + data.contentDtos[i].type + '"  _noteContentId="' + data.contentDtos[i].id + '" _noteId="' + data.contentDtos[i].noteid + '">';
            } else {
                //优秀的笔记
                ncHTML += '<li class="noteContent" _userId="' + data.contentDtos[i].userId + '"  _type="2"  _noteContentId="' + data.contentDtos[i].id + '" _noteId="' + data.contentDtos[i].noteid + '">';
            }
            ncHTML += '<div class="learninglist_box">';
            if (num == 0) {
                if (data.contentDtos[i].type == 0) {//我的笔记
                    ncHTML += '<span class="mixturetime" title="'+zLocale.my_note+'">' + data.contentDtos[i].videoTime + ' </span> ';
                } else {//收藏的笔记
                    ncHTML += '<span class="mixturetime1" title="'+zLocale.collection_note+'">' + data.contentDtos[i].videoTime + ' </span> ';
                }
            } else {//优秀笔记
                ncHTML += '<span class="mixturetime" title="'+zLocale.exex_note+'">' + data.contentDtos[i].videoTime + '</span>';
            }
            if (num == 0) {
                if (data.contentDtos[i].type == 1) {
                    //收藏的笔记
                    ncHTML += '<span class="learngreenfont">' + data.contentDtos[i].realName + ':</span>';
                } else {
                    ncHTML += '<span class="learnotelist_del fr" style="display:none"></span>';
                }
            }
            if (num == 1) {//优秀笔记
                ncHTML += '<span class="learngreenfont">' + data.contentDtos[i].realName + ':<span>';
            }
            ncHTML += '<span class="mixturedescribe">' + data.contentDtos[i].content + '</span></div>';

            ncHTML += '<div class="learningperation_box clearfix">';
            ncHTML += '<span class="date fl">' + data.contentDtos[i].createTime.replace("T", " ") + '</span>';
            //用户操作 评论 赞 收藏
            ncHTML += '<div class="operationdiv fr"><ul>';
            ncHTML += getOpera(data.contentDtos[i]);
            ncHTML += '</ul></div></div>';
            //评论框
            ncHTML += '<div class="learningcommentbox" style="display:none;">';
            ncHTML += '<em></em>';
            ncHTML += '<div class="talkConIpt"><textarea rows="10" cols="15" style="display: inline;" value="'+zLocale.input_comment+'" class="inputFeint"></textarea>';
            ncHTML += '<div style="display: none;" class="talkWrapBot clearfix mt10">';
            if (z_locale==1) {
            	 ncHTML += '<a href="javascript:void(0);" class="commonBtn_green fr"><span class="learnthemeBg commentfabiao">'+zLocale.publish+'</span></a><span class="talkCountTxt fr">还能输入<span class="number">250</span>字</span></div>';
			}
            if (z_locale==2) {
            	ncHTML += '<a href="javascript:void(0);" class="commonBtn_green fr"><span class="learnthemeBg commentfabiao">'+zLocale.publish+'</span></a><span class="talkCountTxt fr">Can still input <span class="number">250</span> words</span></div>';
            }
           

            ncHTML += '<div class="notetalkWrapMsg">';
            ncHTML += '<ul></ul>';
            ncHTML += '</div>';
            if (z_locale==1) {
            	 ncHTML += '<div class="learcomment-more more_comment" _pageNo="1"><a href="javascript:void(0)">点击查看更多评论</a></div>';
			}
           if (z_locale==2) {
        	   ncHTML += '<div class="learcomment-more more_comment" _pageNo="1"><a href="javascript:void(0)">Click to get more</a></div>';
           }
          
            ncHTML += '</div></li>';
        }
        return ncHTML;
    }

    //获得更多评论
    function getmoreComment() {
        $(".more_comment").die("click").live("click", function () {
            if (!commitStatus) {
                return;
            }
            commitStatus = false;
            var $this = $(this);
            var noteId = $this.parents(".noteContent").attr("_noteId");
            var noteContentId = $this.parents(".noteContent").attr("_noteContentId");
            var pageNo = $this.attr("_pageNo");
            var $commBox = $this.parents(".noteContent").find(".learningcommentbox");
            var data = {
                'noteId': noteId, 'noteContentId': noteContentId, "pageNo": pageNo
            };
            $.ajax({
                type: "post", data: data, url: basePath + "/json/learning/findNoteComments?v=" + getNowTime(),
                success: function (data) {
                    $commBox.find("ul").append(getCommentHTML(data.noteContentCommentDtos));
                    $this.attr("_pageNo", parseInt(pageNo) + 1)
                    if (data.commentCount < 10 * (parseInt(pageNo) + 1)) {
                        $commBox.find(".learcomment-more").css("display", "none");
                    }
                    commitStatus = true;
                }
            });
        });
    }

    //用户评论
    function addcomment() {
        $(".commentfabiao").die("click").live("click", function () {
            if (!commitStatus) {
                return;
            }
            commitStatus = false;
            var $this = $(this);
            var noteId = $this.parents(".noteContent").attr("_noteId");
            var noteContentId = $this.parents(".noteContent").attr("_noteContentId");
            var $commBox = $this.parents(".noteContent").find(".learningcommentbox");
            var content = $commBox.find(".inputFeint").val();
            if (content.replace(/(^\s+)|(\s+$)/g, "") == "") {
                $.tmDialog.alert({
                    content: zLocale.content_notnull, showBtn: false, icon: "warm", fadeout: true, timeout: 1, finish: function (ok) {
                    }
                });
                commitStatus = true;
                return;
            }
            var data = {'noteId': noteId, 
	            		'noteContentId':noteContentId, 
	            		'content': content,
	            		"lessonId":lessonId,
	            		"lessonVideoId":lessonVideoId}
            $.ajax({
                type: "post", data: data, url: basePath + "/json/learning/saveNoteContentComment?v=" + getNowTime(),
                success: function (data) {
                    $this.parents(".noteContent").find(".comment").removeClass("comment").addClass("comment_cur");
                    var count = parseInt($this.parents(".noteContent").find(".commentCount").text().replace(/[^0-9]/ig, "")) + 1;
                    $this.parents(".noteContent").find(".commentCount").text("(" + count + ")");
                    $this.parents(".noteContent").find(".commentCount").removeClass("font").addClass("font_cur");
                    $commBox.find(".inputFeint").val("");
                    $commBox.find("ul").prepend(getCommentHTML(data.noteContentCommentDtos));

                    commitStatus = true;

                }
            });

        });
    }

    function textAreaEvent() {
        //评论框
        $(".inputFeint").die("click").live("click", function () {
            if ($(this).val() == zLocale.input_comment) {
                $(this).val("");
            }
            $(this).next(".talkWrapBot").show();

        });
    }

    var maxInputNum = 250;

    function numberCheck() {
        $(".inputFeint").die("focus").live("focus", function () {
            if ($(this).val() == zLocale.input_comment) {
                $(this).val("");
            }
            var count = $(this).val().length;

            $(this).next(".talkWrapBot").find(".number").html(maxInputNum - count);
        });
        $(".inputFeint").die("keyup").live("keyup", function (event) {

            var count = $(this).val().length;
            if (count > maxInputNum) {
                event.returnValue = false;
                $(this).val($(this).val().substring(0, maxInputNum));
                count = $(this).val().length;
            }
            $(this).next(".talkWrapBot").find(".number").html(maxInputNum - count);
        });
    }

    //获取操作html
    function getOpera(noteContent) {
        var textHtml = "";
        if (noteContent.iscollection == 0) {
            textHtml += '<li><a href="javascript:void(0)"><span class="collect fl"></span><span class="font fl">(' + noteContent.collectionCount + ')</span></a></li>';
        } else {
            textHtml += '<li><a href="javascript:void(0)"><span class="collect_cur fl"></span><span class="font_cur fl">(' + noteContent.collectionCount + ')</span></a></li>';
        }
        if (noteContent.iscomment == 0) {
            textHtml += '<li><a href="javascript:void(0)"><span class="comment fl"></span><span class="font fl commentCount">(' + noteContent.commentCount + ')</span></a></li>';
        } else {
            textHtml += '<li><a href="javascript:void(0)"><span class="comment_cur fl"></span><span class="font_cur fl commentCount">(' + noteContent.commentCount + ')</span></a></li>';
        }
        if (noteContent.ispraise == 0) {
            textHtml += '<li><a href="javascript:void(0)"><span class="praise fl "></span><span class="font fl">(' + noteContent.praiseCount + ')</span></a></li>';
        } else {
            textHtml += '<li><a href="javascript:void(0)"><span class="praise_cur fl"></span><span class="font_cur fl">(' + noteContent.praiseCount + ')</span></a></li>';
        }
        return textHtml;
    }

    //查看评论
    function showComment() {
        $(".comment,.comment_cur,.commentCount").die("click").live("click", function () {

            if (!commitStatus) {
                return;
            }
            commitStatus = false;
            var $this = $(this);
            var noteId = $this.parents(".noteContent").attr("_noteId");
            var noteContentId = $this.parents(".noteContent").attr("_noteContentId");
            var $commBox = $this.parents(".noteContent").find(".learningcommentbox");

            if ($commBox.css("display") == "block") {
                $commBox.css("display", "none");
                commitStatus = true;
                return;
            }
            var data = {
                'noteId': noteId, 'noteContentId': noteContentId
            };
            $.ajax({
                type: "post",
                data: data,
                url: basePath + "/json/learning/findNoteComments?v=" + getNowTime(),
                success: function (data) {
                    $commBox.find("ul").html(getCommentHTML(data.noteContentCommentDtos));
                    if (data.commentCount < 10) {
                        $commBox.find(".learcomment-more").css("display", "none");
                    }
                    commitStatus = true;
                    $commBox.css("display", "block")
                }
            });
        });

    }

    //获取评论内容
    function getCommentHTML(commentdtos) {
        var commentHTML = "";
        for (var i = 0; i < commentdtos.length; i++) {
            commentHTML += '<li class="clearfix">';
            commentHTML += '<div class="learnotegHeader fl">';
            if (commentdtos[i].userPicUrl != null && commentdtos[i].userPicUrl != "" && commentdtos[i].userPicUrl != '') {
                commentHTML += '<a href="javascript:void(0)"><img class="personHead" _ishare="' + commentdtos[i].isShare + '" _userid="' + commentdtos[i].userid + '" _noteid="' + commentdtos[i].noteId + '"  width="30" height="30" src="' + commentdtos[i].userPicUrl + '"></a></div>';
            } else {
                commentHTML += '<a href="javascript:void(0)"><img class="personHead" _ishare="' + commentdtos[i].isShare + '" _userid="' + commentdtos[i].userid + '" _noteid="' + commentdtos[i].noteId + '" width="30" height="30" src="http://image.zhihuishu.com/zhs/ablecommons/demo/201708/0fa798b97abf4a06ae8882e785645e83.png"></a></div>';
            }
            commentHTML += '<div class="learcomm_list fl">';
            commentHTML += '<p>';
            commentHTML += '<a href="javascript:void(0)" class="personHead" _ishare="' + commentdtos[i].isShare + '" _userid="' + commentdtos[i].userid + '" _noteid="' + commentdtos[i].noteId + '">' + commentdtos[i].userName + ':</a>';
            commentHTML += '<span class="notelist_p">' + commentdtos[i].content + '</span>';
            commentHTML += '</p>';
            commentHTML += '<p class="time">('+zLocale.publish_at+'' + commentdtos[i].createTime.replace("T", " ") + ')</p>';
            commentHTML += '</div></li>';
        }

        return commentHTML;
    }

    //取消收藏
    function collectionCancle() {
        $(".collect_cur").die("click").live("click", function () {
            if (!commitStatus) {
                return;
            }
            commitStatus = false;
            var $this = $(this);
            var noteId = $this.parents(".noteContent").attr("_noteId");
            var noteContentId = $this.parents(".noteContent").attr("_noteContentId");
            var data = {
                'noteId': noteId, 'noteContentId': noteContentId,
                "lessonId": lessonId, "lessonVideoId": lessonVideoId
            };
            $.ajax({
                type: "post",
                data: data,
                url: basePath + "/json/learning/noteContentCollectCancle?v=" + getNowTime(),
                success: function (data) {
                    $this.removeClass("collect_cur").addClass("collect");
                    var count = parseInt($this.next("span").text().replace(/[^0-9]/ig, "")) - 1;
                    var $nextSpan = $this.next("span");
                    $nextSpan.text("(" + count + ")");
                    $nextSpan.removeClass("font_cur").addClass("font");
                    commitStatus = true;
                }
            });
        })
    }

    //收藏
    function collection() {
        $(".collect").die("click").live("click", function () {
            if (!commitStatus) {
                return;
            }
            commitStatus = false;
            var $this = $(this);
           /* if (userId == $this.parents(".noteContent").attr("_userId")) {
                $.tmDialog.alert({
                    content: "自己不可以收藏自己的笔记哟", showBtn: false, icon: "warm", fadeout: true, timeout: 1, finish: function (ok) {
                    }
                });
                commitStatus = true;
                return;
            }*/
            var noteId = $this.parents(".noteContent").attr("_noteId");
            var noteContentId = $this.parents(".noteContent").attr("_noteContentId");
            var data = {
                'noteId': noteId, 'noteContentId': noteContentId, "chapterId": chapterId,
                "lessonId": lessonId, "lessonVideoId": lessonVideoId, "courseId": courseId
            };
            $.ajax({
                type: "post", data: data, url: basePath + "/json/learning/noteContentCollect?v=" + getNowTime(),
                success: function (data) {
                    $this.removeClass("collect").addClass("collect_cur");
                    var count = parseInt($this.next("span").text().replace(/[^0-9]/ig, "")) + 1;
                    var $nextSpan = $this.next("span");
                    $nextSpan.text("(" + count + ")");
                    $nextSpan.removeClass("font").addClass("font_cur");
                    commitStatus = true;
                }
            });
        });
    }

    //用户取消赞
    function canclePriase() {
        $(".praise_cur").die("click").live("click", function () {
            if (!commitStatus) {
                return;
            }
            commitStatus = false;
            var $this = $(this);
            var noteId = $this.parents(".noteContent").attr("_noteId");
            var noteContentId = $this.parents(".noteContent").attr("_noteContentId");
            var data = {
                'noteId': noteId, 'noteContentId': noteContentId,
                "lessonId":lessonId,"lessonVideoId":lessonVideoId
            };
            $.ajax({
                type: "post", data: data, url: basePath + "/json/learning/noteContentPraiseCancle?v=" + getNowTime(),
                success: function (data) {
                    $this.removeClass("praise_cur").addClass("praise");
                    var count = parseInt($this.next("span").text().replace(/[^0-9]/ig, "")) - 1;
                    var $nextSpan = $this.next("span");
                    $nextSpan.text("(" + count + ")");
                    $nextSpan.removeClass("font_cur").addClass("font");
                    commitStatus = true;
                }
            });
        });
    }

    //用户赞
    function priase() {
        $(".praise").die("click").live("click", function () {
            if (!commitStatus) {
                return;
            }
            commitStatus = false;
            var $this = $(this);
            var noteId = $this.parents(".noteContent").attr("_noteId");
            var noteContentId = $this.parents(".noteContent").attr("_noteContentId");
            var data = {
                'noteId': noteId, 'noteContentId': noteContentId,
                "lessonId":lessonId,"lessonVideoId":lessonVideoId
            };
         
            $.ajax({
                type: "post", data: data, url: basePath + "/json/learning/noteContentPraise?v=" + getNowTime(),
                success: function (data) {
                    $this.removeClass("praise").addClass("praise_cur");
                    var count = parseInt($this.next("span").text().replace(/[^0-9]/ig, "")) + 1;
                    var $nextSpan = $this.next("span");
                    $nextSpan.text("(" + count + ")");
                    $nextSpan.removeClass("font").addClass("font_cur");
                    commitStatus = true;
                }
            });

        });
    }

    /**
     * 保存笔记
     */
    function saveNote() {
        $(".cnotes_submit").die("click").live("click", function () {
            var content = $(".cnotes_area").val();
            if (content.replace(/\s/g, '') == "") {
                $.tmDialog.alert({
                    content: zLocale.content_notnull, icon: "warm", fadeout: true, timeout: 1, finish: function (ok) {
                    }
                });
                $(".cnotes_area").focus();
                return;
            } else if (content.length > 1000) {
                $.tmDialog.alert({
                    content: zLocale.content_too_long, icon: "warm", fadeout: true, timeout: 1, finish: function (ok) {
                    }
                });
                $(".cnotes_area").focus();
                return;
            }
            getNoteTime();
            var params = {};
            params['noteContentDto.noteid'] = noteId;
            params['noteContentDto.chapterId'] = chapterId;
            params['noteContentDto.content'] = content;
            params['noteContentDto.videoTime'] = currentPlayTime;
            params['noteContentDto.lessonId'] = lessonId;
            params['noteContentDto.courseId'] = courseId;
            params['userId'] = userId;
            if (lessonVideoId) {
                params['noteContentDto.lessonVideoId'] = lessonVideoId;
            }

            if (commitStatus) {
                commitStatus = false;
                $.ajax({
                    type: "post",
                    url: basePath + "/json/learning/saveNote?t=" + getNowTime(),
                    data: params,
                    success: function (data) {
                        commitStatus = true;
                        if (data.ajax == false) {
                            alert(zLocale.save_fail);
                        } else {
                            $('.no-note').hide();
                            $(".noteContentul").append(transIntoHtml(data, 0));
                            $(".cnotes_area").val("");
                            $('.noteContentul').scrollTop($('.noteContentul')[0].scrollHeight);
                            noteScroll();
                            hoverNote();
                            deleteNote();
                            notePlayTime();
                            $(".cnotes_area").focus();
                        }
                    }
                });
            } else {
                tmInitLoadingT(zLocale.save_data_now, 2000);
            }

        });
    }

    /**
     * 删除笔记
     */
    function deleteNote() {
        $("ol.cnotes_list").find("li").find("a.cnotes_delete").die('click').live('click', function () {
            var $this = $(this);
            if (!commitStatus) {
                return;
            }
            $.tmDialog.confirm({
                content: zLocale.are_you_sure_delete, icon: "warm",
                callback: function (ok) {
                    if (ok) {
                        var noteId = $this.attr("_id");
                        commitStatus = false;
                        $.ajax({
                            type: "post",
                            url: ctx + "/json/learning/deleteNote?time=" + getNowTime(),
                            data: "notesDto.id=" + noteId,
                            success: function (data) {
                                commitStatus = true;
                                $this.parents("li.cnotes_one1").hide("clip", function () {
                                    $this.parents("li.cnotes_one1").remove();
                                });
                            },
                            error: function () {
                                commitStatus = true;
                            }
                        });
                    }
                }
            });
        });
    }

    /**
     * 显示删除笔记按钮
     *
     * @memberOf {TypeName}
     */
    function hoverNote() {
        $("ol.cnotes_list").find("li").unbind("hover");
        $("ol.cnotes_list").find("li").hover(function () {
            $(this).find("a.cnotes_delete").show();
        }, function () {
            $(this).find("a.cnotes_delete").hide();
        });
    }


    function notePlayTime() {
        $(".mixturetime").die("click").live("click", function () {
            var time = $(this).text();
            var date = new Date("January 1,1970 " + time);
            ablePlayerX("mediaplayer").seek((date.getTime() + (1000 * 3600 * 8)) / 1000);
        });
    }

    /** 每10秒保存视频播放时间点* */
    var saveCacheIntervalTimeState = true;
    function saveCacheIntervalTime() {
    	var studyStatus = $("#studyStatus").val();
    	//做控制，如果学习状态为1，表示该学生的该门课程已经结束，继续观看视频将不会再继续记录缓存，by wyj，2016/6/4
    	if(studyStatus==1){
    		return;
    	}
    	//token验证不通过的
    	if(tokenFlag != true){
    		return;
    	}
        if (isSignUp()) {//isSignUp,是否报名
            if (!saveCacheIntervalTimeState) {
                return;
            }
            if(studiedId == null || studiedId == ""){
            	return;
            }
            getNoteTime();// 获取当前noteTime 00:00:30
            var params = {};
            params['rid'] = rid;
            params['chapterId'] = chapterId;
            params['courseId'] = courseId;
            params['lessonId'] = lessonId;
            params['learnTime'] = currentPlayTime;
            params['studyTotalTime'] = parseInt(studyTotalTime);
            params['__learning_token__'] = Base64.encode(studiedId) ;//studiedId视频学习记录表Id
            params['studyStatus'] = $("#studyStatus").val();
            params['videoId'] = videoId;//视频Id
            // var key = getWatchPointCookieKey(videoId);
            var watchPoint = watchPointPost;
            params['watchPoint'] = watchPoint;
            watchPointPost = "";
            // $.cookie(key,null, { expires: 0 });
            var pv = [rid, lessonId, lessonVideoId == null ? 0 : lessonVideoId, videoId];
            params['ev'] = D24444.Z(pv);
            if($("#csrfToken").val() == "" || $("#csrfToken").val() == null){
            	csrfToken = null;
            }
            if(!csrfToken) csrfToken = $("#csrfToken").val() ;	// 如果变量中取不到Token，从隐藏域中获取
            params['csrfToken'] = csrfToken ;

            if (isNotEmpty(lessonVideoId))  params['lessonVideoId'] = lessonVideoId;
            saveCacheIntervalTimeState = false;
            $.ajax({
                async: true, type: 'post', url: basePath + '/json/learning/saveCacheIntervalTime?time=' + getNowTime(), data: params, success: function (data) {
//                	var oneWindowFlag = data.oneWindowFlag;
//                	if (!oneWindowFlag) {
//                		$.tmDialog.alert({
//            				icon:"warm",
//            				title:zLocale.kindly_remind,
//            				//同时播放多个视频，其他页面的学习进度将停止记录哦！
//            				content:zLocale.only_one_window_to_watch,
//            				sureButton:zLocale.sure//确定按钮字
//            			});
//					}
               		saveCacheIntervalTimeState = true;
                },
                error: function (e) {
                    if (console) {
                        console.log(e.status);
                    }
                    //保存观看记录到cookie
                    saveLearningToCookie();
                    saveCacheIntervalTimeState = true;
                }
            });
        }
    }

    /** 每5分钟保存视频播放时间点* */
    function saveDatabaseIntervalTime(type, video) {//TG破解
//    	var studyStatus = $("#studyStatus").val();
//    	//做控制，如果学习状态为1，表示该学生的该门课程已经结束，继续观看视频将不会再继续记录到数据库，by wyj，2016/6/4
//    	if(studyStatus==1){
//    		return;
//    	}
        if (isSignUp()) {//isSignUp,是否报名
            if (!saveDatabaseState) {
                return;
            }
            getNoteTime();
            var url = basePath + '/json/learning/saveDatabaseIntervalTime?time=' + getNowTime();
            var params = {};
            params['__learning_token__'] = Base64.encode(studiedId) ;
            params['studiedLessonDto.learnTime'] = 9999999;
            params['studiedLessonDto.studyTotalTime'] = 9999999;
            params['studiedLessonDto.playTimes'] = 9999999;
            params['studiedLessonDto.recruitId'] = rid;
            params['studiedLessonDto.lessonVideoId'] = lessonVideoId;
            params['studiedLessonDto.lessonId'] = lessonId;
            params['studiedLessonDto.videoId'] = videoId;
            params['studyStatus'] = 1;//是否学习完标志 ， 1-学习完 0-未完成
            params['studiedLessonDto.sourseType'] = 1;//1.pc 2.ios 3.android
            var pv = [rid, lessonId, lessonVideoId == null ? 0 : lessonVideoId, videoId, 1];
            params['ev'] = D24444.Z(pv);
            if ($("#csrfToken").val() == "") {
            	csrfToken = null;
			}
            if(!csrfToken) csrfToken = $("#csrfToken").val() ;	// 如果变量中取不到Token，从隐藏域中获取
            if(!!csrfToken) {
            	params['csrfToken'] = csrfToken;
            } else {
            	params['noTokenMsg'] = "<没有Token>" + browserMsg($) ;		// 记录浏览器信息
            }
            saveDatabaseState = false;
            $.ajax({
                async: true, type: 'post', url: url, data: params,
                success: function (data, textStatus, jqXHR) {
                	csrfToken = data.csrfToken ;
                	tokenFlag = data.tokenFlag;//token是否通过验证标志
                	var oneWindoFlag = data.oneWindowFlag//是否是单窗口观看
                	$("#csrfToken").val(csrfToken) ;	// 维护hidden标签，防止请求时使用旧的令牌
                	if(!csrfToken) {
//                		alert("请求未通过安全检查，请刷新重试\r\n多次尝试仍不能解决问题，请联系客服上报您的故障信息，我们将尝试为您解决!") ;
//                		return ;
                		// XXX 暂不做业务提示，控制台打印异常消息
                		if(console && console.log) console.log("更新视频进度请求响应消息头中未包含令牌!");
                	}
                	playTimes = 0 ;	// 保存过后，将播放时长重置
                	//token验证不通过的，观看状态给未完成
                	if (tokenFlag != null && !tokenFlag) {
                		loadClickVideoInfo(type, video, 0);
					}else{
						loadClickVideoInfo(type, video, getWatchState(calculate()));
					}
                	if (!tokenFlag) {
                		$.tmDialog.alert({
            				icon:"warm",
            				title:zLocale.kindly_remind,
            				content:zLocale.error_learning_remind,
            				sureButton:zLocale.sure//确定按钮字
            			});
					}
                	if(oneWindoFlag != undefined && !oneWindoFlag){
                		$.tmDialog.alert({
            				icon:"warm",
            				title:zLocale.kindly_remind,
            				//同时播放多个视频，其他页面的学习进度将停止记录哦！
            				content:zLocale.only_one_window_to_watch,
            				sureButton:zLocale.sure//确定按钮字
            			});
                	}
               		saveDatabaseState = true;
                	if(data && data.httpCode && data.httpCode == 1001) {
                		$.tmDialog.tipSuccess({icon:"warn",zindex:1000,msg:zLocale.video_porcess_save_faild,time:1});
                	}
                },
                error: function (e) {
                    saveDatabaseState = true;
                    if (console) {
                        console.log(e.status);
                    }
                    loadClickVideoInfo(type, video, saveLearningToCookie());

                }
            });
        } else {
            loadClickVideoInfo(type, video);
        }

    }
    
    


    function changeWatchState(watchState) {
        $('#video-' + videoId).attr('watchState', watchState);
        if (watchState == 1) {
            $('#video-' + videoId).find('.isStudiedLesson').removeClass().addClass('time_ico3').addClass('isStudiedLesson').addClass('fl');
        } else if (watchState == 2) {
            $('#video-' + videoId).find('.isStudiedLesson').removeClass().addClass('time_ico_half').addClass('isStudiedLesson').addClass('fl');
        } else {
            $('#video-' + videoId).find('.isStudiedLesson').removeClass().addClass('time_ico1').addClass('isStudiedLesson').addClass('fl');
        }

        if ($('.current_play').attr('_videoId') == videoId) {
            $('#video-' + videoId).find('.isStudiedLesson').removeClass().addClass('time_ico').addClass('isStudiedLesson').addClass('fl');
        }
    }

    function getCookieKey(videoId) {
        return "zsh_learning_rid_" + rid + "_userId_" + userId + "_videoId_" + videoId;
    }
    function getWatchPointCookieKey(videoId) {
        return "zsh_learning_WatchPoint_rid_" + rid + "_userId_" + userId + "_videoId_" + videoId;
    }
    function getWatchState(size) {
        //modify by wyj,20170821,req-3150
        return size > 80 ? 1 : 2;
    }

    function saveLearningToCookie() {
        var key = getCookieKey(videoId);
        var watchState = getWatchState(calculate());
        var _value = watchState + "_" + studyTotalTime + "_" + currentPlayTime;
        $.cookie(key, _value, {expires: 3, path: '/'});
        return watchState;
    }

    function loadClickVideoInfo(type, video, watchState) {
        if (type == 1 && video) {
            changeWatchState(watchState);
            // 加载当前点击视频
            initIsJumpChapterParams(video);
        }
    }


    /**
     *  时间转秒
     */
    function timeToSec(date) {
        if (isEmpty(date)) return;
        date = date.split('.')[0];
        var times = date.split(':');
        var hour = trim(times[0]);
        var min = trim(times[1]);
        var sec = trim(times[2]);
        return parseInt((hour * 60 * 60)) + parseInt((min * 60)) + parseInt(sec);
    }

    function trim(str) {
        return $.trim(str);
    }

    /** 视频弹题* */
    function suspendTime() {
        clearInterval(popupExamInterval);
        clearInterval(popupPicInterval);
        if (lessonQuestions != "") {
        	preventPopupTest = true;
            popupExamInterval = setInterval(executeTimeQuestion, 1000);
        }
        if (lessonPictures != "") {
        	popupPicInterval = setInterval(executeTimePicture, 1000);
        }
    }

    /**
     * 停止播放器
     */
    function stopPlayVideo() {
        ablePlayerX("mediaplayer").pause(true);
    }

    /**
     * 弹出视频时间点对应的节试题
     */
    function executeTimeQuestion() {
        getNoteTime();
        if (checkIsExistPicAtSameSecond()) {
			if (preventPopupTest) {
				return;
			}
		}
        if (lessonQuestions.indexOf(currentPlayTime) > -1 && currentPlayTime) {
            clearInterval(popupExamInterval);
            lessonQuestions = lessonQuestions.replace(currentPlayTime, "");
            ablePlayerX("mediaplayer").setFullscreen(false);// 设置是否全屏
            loadTimeQuestionPage(currentPlayTime);
        }
    }
    
    /**
     * 弹出视频时间点对应的节图
     */
    function executeTimePicture() {
        getNoteTime();
        if (lessonPictures != "" && lessonPictures != undefined) {
        	lessonPictures = "," + lessonPictures + ",";
        	var curTime = "," + Math.floor(ablePlayerX("mediaplayer").getPosition()) + ",";//获得当前视频时间节点
        	if (lessonPictures.indexOf(curTime) > -1 && Math.floor(ablePlayerX("mediaplayer").getPosition())) {
				window.clearInterval(popupPicInterval);
				lessonPictures = lessonPictures.replace(curTime, ",");//移除掉这个节点
				stopPlayVideo();//停止播放器
				ablePlayerX("mediaplayer").setFullscreen(false);// 设置是否全屏
				// XXX 暂时取消全屏弹图和弹题
                // 退出全屏弹题、弹图
            	if (ablePlayerX("mediaplayer").getFullStatus()) {
            		ablePlayerX("mediaplayer").exitFullPlay();//退出全屏    		
            	}
				//弹图
                $("#uploadedImg").attr("src",$("span[id^='pictureDot'][timenote="+Math.floor(ablePlayerX("mediaplayer").getPosition())+"]").attr("picurl"));
                $("#videoOperationPanel").show();
			}
		}
    }
    
    /**
     * 判断同一秒内是否存在弹图
     * @returns 返回是否阻止弹出弹题方法的标识 true:阻止弹题 false:不阻止弹题
     */
    function checkIsExistPicAtSameSecond () {
    	if ($("span.pictureDot[timenote='"+Math.floor(ablePlayerX("mediaplayer").getPosition())+"']").length > 0) {
        	return true;
        } else {
        	return false;
        }
    }

    /**
     * 加载视频弹题页面
     * @param time
     */
    function loadTimeQuestionPage(time) {
    	// XXX 暂时取消全屏弹图和弹题
        // 退出全屏弹题、弹图
    	if (ablePlayerX("mediaplayer").getFullStatus()) {
    		ablePlayerX("mediaplayer").exitFullPlay();//退出全屏    		
    	}
        stopPlayVideo();
        // 小节测试
        if ($('.current_play').hasClass('children')) {
            $.tmDialog.iframe({
                title: zLocale.test,
                showBtn: true,
                showBtnType: 'cancel',
                buttonValue: zLocale.close,
                btnArrow: 'center',
                pos: "absolute",
                showBtnType: 'cancel',
                buttonValue: zLocale.close,
                btnArrow: 'center',
                url: basePath + "/learning/lessonPopupExam?time=" + time + "&lessonId=" + lessonId + "&lessonVideoId=" + lessonVideoId + "&rid=" + rid,
                top: 100,
                offsetTop: -10,
                width: 770,
                height: 360,
                zindex : 1000,
                callback: function ($dialog, $iframe, $parent, opts) {
                    if ($dialog && $iframe && $parent) {
                    }
                    else {
                        ablePlayerX("mediaplayer").play();
                    }
                }
            });
            // 节测试
        } else {
            $.tmDialog.iframe({
                     title: zLocale.test,
                     showBtn: true,
                     showBtnType: 'cancel',
                     buttonValue: zLocale.close,
                     btnArrow: 'center',
                     pos: "absolute",
                     showBtnType: 'cancel',
                     buttonValue: zLocale.close,
                     btnArrow: 'center',
                     url: basePath + "/learning/lessonPopupExam?time=" + time + "&lessonId=" + lessonId + "&rid=" + rid,
                     top: 100,
                     offsetTop: -10,
                     width: 770,
                     height: 360,
                     zindex : 1000,
                     callback: function ($dialog, $iframe, $parent, opts) {
                         if ($dialog && $iframe && $parent) {

                         } else {
                             ablePlayerX("mediaplayer").play();
                         }
                     }
                 });
        }
    }

    /**
     * 点击查看视频弹题
     */
    function showExam() {
        $('.examDot').die('click').live('click', function () {
            var $this = $(this);
            var time = $this.attr('timeNote');
            loadTimeQuestionPage(time);
        });
    }
    
    /**
     * 点击查看视频弹图,by wyj,2016/6/26
     */
    function showPicture() {
        $('.pictureDot').die('click').live('click', function () {
        	//暂停视频
        	stopPlayVideo();
            var $this = $(this);
            //给容器添加图片地址
            $("#uploadedImg").attr("src",$this.attr("picurl"));
            //展示弹图
            $("#videoOperationPanel").show();
        });
    }
    
    
    /**
     * 关闭弹图
     */
    function hidePanel () {
    	$("#closePopupPic").die('click').live('click',function(){
    		$("#videoOperationPanel").fadeOut('fast',function(){
    			$("#uploadedImg").attr("src","");	
    		});
    		preventPopupTest = false;
    		executeTimeQuestion();
    	});
    }
    

    /**
     * 笔记滚动条控制
     */
    function noteScroll() {
        if ($("ol.cnotes_list")[0]) {
            $("ol.cnotes_list").animate({
                scrollTop: $("ol.cnotes_list")[0].scrollHeight - 255
            }, 1000);
        }

    }


    /**
     * 获取当前播放时间
     */
    function getNoteTime() {
        try {
            var millisecond = ablePlayerX("mediaplayer").getPosition() * 1000 - (1000 * 3600 * 8);
            var date = new Date();
            date.setTime(millisecond);
            currentPlayTime = date.toLocaleTimeString();

            if (currentPlayTime == 'Invalid Date') {
                currentPlayTime = "00:00:00";
            }

            // 苹果电脑下noteTime展示错误，下为解决方法//
            if (currentPlayTime.length != 8) {
                var hour = date.getHours().toString();
                var minute = date.getMinutes().toString();
                var seconds = date.getSeconds().toString();

                if (hour.length == 1) {
                    hour = "0" + hour;
                }

                if (minute.length == 1) {
                    minute = "0" + minute;
                }

                if (seconds.length == 1) {
                    seconds = "0" + seconds;
                }

                currentPlayTime = hour + ":" + minute + ":" + seconds;
            }
        } catch (e) {
        } finally {
        }


    }

    /**
     * 弹出学习排名
     */
//    function learningTop() {
//        $("#learningTop").click(function (obj) {
//            $.tmDialog.iframe({
//                title: zLocale.study_rank,
//                target: $(this),
//                showBtn: false,
//                manyOverlay: true,
//                pos: "absolute",
//                url: "/web/pages/learning/learningStuTop.jsp?v=" + getNowTime(),
//                top: 50,
//                width: 600,
//                height: 525,
//                callback: function ($dialog, $iframe, $parent, opts) {
//                    if ($dialog && $iframe && $parent) {
//
//                    }
//                },
//                loadSuccess: function ($iframe, $dialog, opts) {
//                    setTimeout(
//                        function () {
//                            var $children = $($iframe.document);
//                            var bodyHeight = $children.height() + 100;
//                            var parentHeight = $("body").height();
//                            $dialog.find(".popboxes_main").height(430);
//                            $dialog.find("#tmDialog_iframe").attr("height", bodyHeight);
//                            if (parentHeight > bodyHeight) {
//                                bodyHeight = parentHeight;
//                            }
//                            $(".popbox_overlay").height(bodyHeight);
//                            $("#popbox_overlay").height(bodyHeight);
//                        }, 300);
//                }
//            });
//        });
//    }

    /**
     * 教学计划
     */
    function jiaoxuejihua() {
        var url =basePath+"/course/timeSheet?courseId="+courseId;
        $("#jiaoxuejihua").click(function () {
            $.tmDialog.iframe({
                title: zLocale.teach_plan,
                target: $(this),
                showBtn: false,
                manyOverlay: true,
                pos: "absolute",
                url: url,
                top: 20,
                width: 900,
                height: $(window).height() - 150,
                callback: function ($dialog, $iframe, $parent, opts) {
                    // do nothing...
                },
                loadSuccess: function ($iframe, $dialog, opts) {
                    // do nothing...
                }
            });
        });
    }

    /**
     * 教学大纲
     */
    function jiaoxuedaGang() {
        var url =basePath+"/learning/outline?courseId="+courseId+"&rid="+$('#rid').val();
        $("#jiaoxuedaGang").click(function () {
            $.tmDialog.iframe({
                title: zLocale.teach_program,
                target: $(this),
                showBtn: false,
                manyOverlay: true,
                pos: "absolute",
                url: url,
                top: 50,
                width: 900,
                height: $(window).height() - 120,
                callback: function ($dialog, $iframe, $parent, opts) {
                    // do nothing...
                },
                loadSuccess: function ($iframe, $dialog, opts) {
                    // do nothing...
                }
            });
        });
    }

    /**
     * 显示进入课程主页事件
     */
    function intoCourseHomeEvent() {
        $('#intoCourseHome').mouseenter(function () {
            $(this).find('.entercourseindex').fadeIn('fast');
        }).mouseleave(function () {
            $(this).find('.entercourseindex').fadeOut('fast');
        });
    }
});

var vId = 0;//二维码视频id  变值
function loadCourseExam(examId, studentExamId, limitTime, state, startFlag) {
//	var studyStatus = $("#studyStatus").val();
//	if (studyStatus==1) {
//		return;
//	}
    var recruitId=$("#rid").val();
	var courseType = $('#courseType').val();
	//如果是微课
	if (courseType == 2){
		var liArr = $('#chapterList').find('li');
		for(var i=0,len=liArr.length;i<len;i++){
			var $this = $(liArr[i]);
			var state1 = $this.attr('watchstate');
			//状态不为undifine且状态不为已完成
			if(state1 != null && state1 != 1){
				var content = "</br>视频还未看完不能参加考试哦，快去学习吧"
		   		 $.tmDialog.alert({
		   	         content: content,fadeout: true,appendClass:"noIcon",width:317, finish: function (ok) {
		   	         }
		   	     });
				return;
			}
		}
	}
//	$('#chapterList').find('li').each(function(index,li){
//		var $this = $(li);
//		var state = $this.attr('watchstate');
//		if(state != null){
//			
//		}
//	});
	
    if (startFlag < 1) {
    	var startTime ="";
    	var endTime = "";

    	var type=1;
    	//获取期末考试时间
    	$.ajax({
    		type:"post",
    		data:{'studentExamId':studentExamId,"examType":type,"recruitId":recruitId}, 
    		url:basePath+"/json/examNotice/findStudentExamNotice",
    		success:function(data){
    			startTime = data.studentExamNoticeMap['startDate'];
    			endTime = data.studentExamNoticeMap['endDate'];
                var retakeStatus = data.studentExamNoticeMap['retakeStatus'];//补考状态：0允许且仅1次，1禁止补考
                var content = null;
                if (retakeStatus == 0) {
                    content = "期末考试开放时间为"+startTime+"-"+endTime+"总成绩不及格有一次补考机会，根据补考成绩确定最终成绩，在此之前请认真观看教学视频，预祝取得好成绩！"
                }
                if (retakeStatus == 1) {
                    content = "期末考试开放时间为"+startTime+"-"+endTime+"在此之前请认真观看教学视频，预祝取得好成绩！"
                }
		   		 $.tmDialog.alert({
		   	         content: content,fadeout: true,appendClass:"noIcon",width:340,height:125, finish: function (ok) {
		   	         }
		   	     });
    		}
    	});
    } else {
    	
        if (state == 1) {//未开始
            reWorkExam(examId, studentExamId, limitTime, recruitId);
        } else if (state == 4) {//已完成
        	//需求改变：
        	var cont = "考试已上交，不可查看";
        	if(z_locale!=1){
        		cont = "Examination has been submitted, can not be viewed";
        	}
        	 $.tmDialog.alert({content:cont , icon: "warm", fadeout: true, timeout: 3, finish: function (ok) {}});
        	 return false;
        	//原需求
        	 $.ajax({
       	        type: "post",
       	        url: jsonPath + '/exam/isCheckAnswer?time=' + getNowTime(),
       	        data: {"studentExamId":studentExamId},      
       	        error: function () {},
       	        success: function (data) {
       	        	if(data.checkAnswerStatus==0){
       	        		 $.tmDialog.confirm({
       	                     content: zLocale.see_answer_not_again, 
       	                     showBtn: true, icon: "question", sureButton: zLocale.sure,
       	                     cancleButton: zLocale.cancel, fadeout: true, callback: function (ok) {
       	                         if (ok) {
       	                             $.ajax({
       	                                 type: "post", data: {"studentExamId":studentExamId},
       	                                 url: basePath + "/json/exam/updateCheckAnswer?v=" + getNowTime(),
       	                                 success: function (data) {
                                             var params = recruitId+";"+examId;
                                             var doHomeworkResultUrl = workExamUrl+"/stuexam/thridresult?url"+encrypt(params);
                                             openExamWin(doHomeworkResultUrl);
       	                                	// openExamWin(workExamUrl+"/stuexam/thridresult?examId=" + examId + "&id=" + studentExamId +"&recruitId="+recruitId+ "&fromWhere=1");
       	                                 }
       	                             });
       	                         }
       	                     }
       	                 });
       	        	}else{
                        var params = recruitId+";"+examId;
                        var doHomeworkResultUrl = workExamUrl+"/stuexam/thridresult?url"+encrypt(params);
                        openExamWin(doHomeworkResultUrl);
       	        		// openExamWin(workExamUrl+"/stuexam/thridresult?examId=" + examId + "&id=" + studentExamId + "&recruitId="+recruitId + "&fromWhere=1");
       	        	}   	           
       	        }
       	    });
           
        } else if (state == 5) {//退回重做
            reWorkExam(examId, studentExamId, limitTime, recruitId);
        } else {
            if (state == 3) {//已提交
                //openExamWin(workExamUrl+"/stuexam/paperfour?commonId=" + examId + "&id=" + studentExamId + "&fromWhere=1");
            	//原需求
//            	openExamWin(workExamUrl+"/studentHomework/doExam?examId=" + examId + "&id=" + studentExamId + "&fromWhere=1");
            	//需求改变：by wyj,20170217
            	var cont = "考试已上交，不可查看";
            	if(z_locale!=1){
            		cont = "Examination has been submitted, can not be viewed";
            	}
            	 $.tmDialog.alert({content:cont , icon: "warm", fadeout: true, timeout: 3, finish: function (ok) {}});
            	 return false;
            	
            } else {//已开始
               //var Qinfo = zLocale.entering_only_have+"<font color='#FF0000'><b>" + tm_hhmmss(limitTime * 60) + "</b></font>"+zLocale.do_work_time+zLocale.you_must_at+"<font color='#FF0000'><b>" + changeTime(limitTime) + "</b></font>"+zLocale.up_shijuan_before+zLocale.sure_have_enough;
            	var Qinfo = "进入后您只有<font color='#FF0000'><b>" + tm_hhmmss(limitTime * 60) + "</b></font>做题时间  您必须在<font color='#FF0000'><b>" + changeTime(limitTime) + "</b></font>前提交试卷  您确定您有足够的时间完成考试?"; 
            	
            	//var Qinfo=zLocale.exam_time_tip;
            	$.tmDialog.confirm({
                    content: Qinfo, icon: "question", callback: function (ok) {
                        if (ok) {
                            //openExamWin(workExamUrl+"/stuexam/paperfour?commonId=" + examId + "&id=" + studentExamId + "&fromWhere=1");
                        	// openExamWin(workExamUrl+"/studentHomework/doExam?examId=" + examId + "&id=" + studentExamId + "&recruitId="+recruitId + "&fromWhere=1");
                            // 加密请求url
                            var params = recruitId+";"+examId+";1";
                            var doExamUrl = workExamUrl+"/studentHomework/doExam?ev="+encrypt(params);
                            openExamWin(doExamUrl);
                        }
                    }
                });
            }
        }
    }

}
//点击右边作业考试，进行作业考试
//作业考试id，学生作业考试id，type，学生作业考试状态，
function openExam(examId, studentExamId, type, state) {
	//如果studyStatus为1，说明课程结束，学生不能再访问作业考试，by wyj，2016/6/4
//	var studyStatus = $("#studyStatus").val();
//	if (studyStatus==1) {
//		return;
//	}
    var recruitId = $("#rid").val();
	var url = "";
    if(state==4){
    	 $.ajax({
    	        type: "post",
    	        url: jsonPath + '/exam/isCheckAnswer?time=' + getNowTime(),
    	        data: {"studentExamId":studentExamId},      
    	        error: function () {},
    	        success: function (data) {
    	        
    	        	if(data.checkAnswerStatus==0){
    	        		 $.tmDialog.confirm({
    	                     content: zLocale.see_answer_not_again, 
    	                     showBtn: true, 
    	                     icon: "question", 
    	                     sureButton: zLocale.sure,
    	                     cancleButton: zLocale.cancel, 
    	                     fadeout: true, callback: function (ok) {
    	                         if (ok) {
    	                             $.ajax({
    	                                 type: "post", data: {"studentExamId":studentExamId},
    	                                 url: basePath + "/json/exam/updateCheckAnswer?v=" + getNowTime(),
    	                                 success: function (data) {
                                             // 加密打开作业考试
                                             var  params = type+";"+state+";"+examId+";"+studentExamId+";"+recruitId;
                                             var openExamUrl = workExamUrl+"/stuexam/openExam?url="+encrypt(params);
                                             openExamWin(openExamUrl);
    	                                	 // url = workExamUrl+"/stuexam/openExam?type="+ type +"&state="+ state +"&examId=" + examId + "&id=" + studentExamId +"&recruitId="+recruitId+ "&fromWhere=1";
    	                                	 // openExamWin(url);
    	                                 }
    	                             });
    	                         }
    	                     }
    	                 });
    	        	}else{
                        // 加密打开作业考试
                        var  params = type+";"+state+";"+examId+";"+studentExamId+";"+recruitId;
                        var openExamUrl = workExamUrl+"/stuexam/openExam?url="+encrypt(params);
                        openExamWin(openExamUrl);
    	        		// url = workExamUrl+"/stuexam/openExam?type="+ type +"&state="+ state +"&examId=" + examId + "&id=" + studentExamId +"&recruitId="+recruitId+ "&fromWhere=1";
    	        	 	// openExamWin(url);

    	        	}   	           
    	        }
    	    });
    	
    } else if (state == 3){
    	var cont = "作业已上交，不可查看";
    	if(z_locale!=1){
    		cont = "Examination has been submitted, can not be viewed";
    	}
    	 $.tmDialog.alert({content:cont , icon: "warm", fadeout: true, timeout: 3, finish: function (ok) {}});
    	 return false;
    } else {
        // 加密打开作业考试
        var  params = type+";"+state+";"+examId+";"+studentExamId+";"+recruitId;
        var openExamUrl = workExamUrl+"/stuexam/openExam?url="+encrypt(params);
        openExamWin(openExamUrl);
    	// url = workExamUrl+"/stuexam/openExam?type="+ type +"&state="+ state +"&examId=" + examId + "&id=" + studentExamId +"&recruitId="+recruitId+ "&fromWhere=1";
	 	// openExamWin(url);
    }
}

function encrypt(input) {
    var output = '';
    var xorKeys = "ZHIHUISHU";
    for (var i = 0; i < input.length; i++) {
        var num = input.charCodeAt(i) ^ xorKeys.charCodeAt(i % xorKeys.length);
        output += char2Hex(num);
    }
    return output;
}

/**
 * 将10进制转为16进制
 * @param num 10进制
 * @returns 16进制
 */
function char2Hex(num) {
    var hex = num.toString(16);
    hex = hex.length < 2 ? '0' + hex : hex;
    return (hex).slice(-4);
}




function reWorkExam(examId, studentExamId, limitTime, recruitId) {
	if(z_locale==1){//中文
		var Qinfo1 = "<font color='#FF0000'><b>同学！注意啦！这是期末考试<br>你只有一次答题机会，超过答题时间会自动交卷</br></b></font>";
	    $.tmDialog.confirm({
	        content: Qinfo1, icon: "question", callback: function (ok) {
	            if (ok) {
	                var Qinfo = "进入后您只有<font color='#FF0000'><b>" + tm_hhmmss(limitTime * 60) + "</b></font>做题时间,您必须在<font color='#FF0000'><b>" + changeTime(limitTime) + "</b></font>前提交试卷,您确定您有足够的时间完成考试?";
	                $.tmDialog.confirm({
	                    content: Qinfo,
	                    icon: "question",
	                    sureButton:zLocale.sure,//确定按钮字
	            		cancleButton:zLocale.cancel,//取消按钮字
	                    callback: function (ok) {
	                        if (ok) {
	                            //openExamWin(workExamUrl+"/stuexam/paperfour?commonId=" + examId + "&id=" + studentExamId + "&fromWhere=1");
	                        	// openExamWin(workExamUrl+"/studentHomework/doExam?examId=" + examId + "&id=" + studentExamId +"&recruitId="+recruitId+ "&fromWhere=1");
                                // 加密请求url
                                var params = recruitId+";"+examId+";1";
                                var doExamUrl = workExamUrl+"/studentHomework/doExam?ev="+encrypt(params);
                                openExamWin(doExamUrl);
	                        }
	                    }
	                });
	            }
	        }
	    });
	}else{
		var Qinfo1 = "<font color='#FF0000'><b>Please pay attention! This is the final exam.<br>You have only one chance for your paper and it will automatically submit when time is over.</br></b></font>";
	    $.tmDialog.confirm({
        	title:zLocale.tip,
        	sureButton: zLocale.sure,
            cancleButton: zLocale.cancel,
            height:144,
	        content: Qinfo1, 
	        icon: "question",
	        callback: function (ok) {
	            if (ok) {
	            	 var Qinfo = "You  have only<font color='#FF0000'><b>" + tm_hhmmss(limitTime * 60) + "</b></font>to finish the test,and you must submit it before <font color='#FF0000'><b>" + changeTime(limitTime) + "</b></font>,Are you sure that you have enough time?";
	                $.tmDialog.confirm({
	                    content: Qinfo,
	                    icon: "question",
	                    title:zLocale.tip,
	                    sureButton:zLocale.sure,//确定按钮字
	            		cancleButton:zLocale.cancel,//取消按钮字
	                    callback: function (ok) {
	                        if (ok) {
                                //openExamWin(workExamUrl+"/stuexam/paperfour?commonId=" + examId + "&id=" + studentExamId + "&fromWhere=1");
                                // openExamWin(workExamUrl+"/studentHomework/doExam?examId=" + examId + "&id=" + studentExamId +"&recruitId="+recruitId+ "&fromWhere=1");
                                // 加密请求url
                                var params = recruitId+";"+examId+";1";
	                        	var doExamUrl = workExamUrl+"/studentHomework/doExam?ev="+encrypt(params);
                                openExamWin(doExamUrl);
	                        }
	                    }
	                });
	            }
	        }
	    });
	}
    
}

function openExamWin(url) {
    window.open(url, "", "");
}


function changeTime(time) {
    now = new Date(); // 读取当前日期
    now.setTime(now.getTime() + time * 60 * 1000);
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var day = now.getDate();
    var hours = now.getHours();       // 获取当前小时数(0-23)
    var minutes = now.getMinutes();     // 获取当前分钟数(0-59)
    var seconds = now.getSeconds();     // 获取当前秒数(0-59)
    var time_str2 = year + "-" + month + "-" + day + " " + hours + ":" + minutes;
    return time_str2;
}

function openBBS(url) {
    window.open(url, '', '');
}

function getPlayerSize() {
    var jw = $(window).width() - 359;
    var jh = $(window).height() - 305;
    return {
        mW: jw <= 600 ? 600 : jw,
        mh: jh <= 320 ? 320 : jh
    };
};

/**
 * 重置播放器大小
 */
function reSizePlay() {
    ablePlayerX('mediaplayer').resize(getPlayerSize().mW, getPlayerSize().mh);
    reSizePlayer(getPlayerSize().mW, getPlayerSize().mh);
}

window.onresize = reSizePlay;

var defInnerWidth;// 播放器进度条默认内部长度
function reSizePlayer(mW, mh) {
    if ($(".exploreTip").css("display") == "block") {
        mh = mh - 30;
    }
    defInnerWidth = mW - 150;
    // 播放完成操作层
    $('.videoDotAddWrap,.test_section_bg').css({width: mW, height: mh});
    $('#videoOperationPanel ul').css({
        left: (mW / 2) - ($('#videoOperationPanel ul').width() / 2),
        top: (mh / 2) - $('#videoOperationPanel ul').height() - 50
    });
    // 视频打点容器
    $('.videoDotBox').css({width: mW});
    // 播放列表// 资料列表
    $('.catalogue_ul1').css({height: mh});
    //新的笔记内容列表高度
    $('.noteContentul').css({height: mh - 110});
    //优秀笔记内容列表高度
    $('.execnoteContentul').css({height: mh - 0}); // 笔记列表
    $('.box_cnotes1').css({height: mh - 27});
    //如果有顶部提示框，则弹图高度需要调整
    if(!$(".exploreTip").hasClass("display")){
    	$("#videoOperationPanel").css({
        	height: $("#videoOperationPanel").height() + 30
        });
    }
    //图片高度与videoOperationPanel蒙层相等
    $("#showImgDiv").css({
    	height: $("#videoOperationPanel").height()
    });
}

function closeTip(id) {
    $('#' + id).fadeOut('fast', function () {
        $(this).remove();
    });
}

/**
 * 取消支付
 */
function cancelPay() {
    $(".entirePayDiv").fadeOut("slow");
}

function sign(obj) {
    var opener = $(obj).attr("opt");
    var url = "";
//    if (opener == 1) {	//个人开课
    url = basePath + "/apply/applystep/" + $("#rid").val();
//    } else {
//        url = basePath + "/apply/signup/" + $("#courseId").val();
    //url = "http://myuni.zhihuishu.com/myunihome4os/pages/recruit/courseFlowPath3.jsp?schoolId="+$("schoolId").val()+"&shareCourseRecruitId="+targetR.attr("srid");
//    }
    window.open(url, '_blank');
    $("#ensureSign").text(zLocale.re_registration);
    $("#cancelSign").text(zLocale.enroll_success);
    $("#cancelSign").unbind("click");
    $("#cancelSign").click(function () {
        location.reload();
    });
}

//申请报名
function apply(rectid) {
    var url = basePath + "/json/apply/application/" + rectid;
    $.post(url, {}, function (data) {
        if (data.code == 4000) {
            // 验证用户信息
            idAuthentication(rectid, isFreeMinCourse);
            // 跳转到申请页面
            location.href = basePath + "/apply/applystep/" + rectid;
        } else if (data.code == 2001) {
            $.tmDialog.alert({content: zLocale.recruit_not_begin});
        } else if (data.code == 2003) {
            $.tmDialog.alert({content: zLocale.recruit_is_stop});
        } else if (data.code == 2004) {
            $.tmDialog.alert({content: zLocale.recruit_is_pause});
        } else if (data.code == 3001) {
            $.tmDialog.alert({content: zLocale.recruit_people_full});
        } else if (data.code == 502) {
            $.tmDialog.alert({content: zLocale.you_repeat_regist});
        } else if (data.code == 503) {
            $.tmDialog.alert({content: zLocale.nfo_being_reviewed});
        } else {
            $.tmDialog.alert({content: zLocale.data_exception});
        }
    }, "json");
}


$(function () {
    (function ($) {
        var n = 1;
        $('.topicTitle li').each(function (index, obj) {
            var now = 4 * n - 1;
            if (index == now) {
                $(obj).css({'margin-right': '0px'});
                n++;
            }
        });
    })(jQuery);
});

//徽章是否升级了
function upgrade() {
//
//    var recruitId = $("#rid").val();
//    if (!recruitId)return;
//    $.ajax({
//        type: "post",
//        url: "http://online.zhihuishu.com/onlineSchool/json/badge/upgrade",
//        data: "recruits=" + recruitId,
//        beforeSend: function () {
//        },
//        error: function () {
//            //tmInitLoadingT("数据加载异常,请稍后再试！",2000);
//        },
//        success: function (data) {
//
//            if (isNotEmpty(data.maps)) {
//                showBadge(data.maps[0].type, data.maps[0].name);
//            }
//
//
//        }
//    });
}

var badgeLevelName = [zLocale.flusher_start, 
                      zLocale.tupo_qiangren, 
                      zLocale.explore, 
                      zLocale.effective_king,
                      zLocale.wuxing_gaoshou, 
                      zLocale.endurance_super, 
                      zLocale.good_learner, 
                      zLocale.sprint_expert,
                      zLocale.study_hagnjia, 
                      zLocale.super_scholar];
function loadBadgeName() {
//    var recruitId = $("#rid").val();
//    if (!recruitId)return;
//    $.ajax({
//        async: true,
//        type: 'post',
//        url: "/onlineSchool/json/badge/loadRecruitBadge",
//        data: "recruits=" + recruitId,
//        beforeSend: function () {
//            return true;
//        },
//        success: function (data) {
//            if (isNotEmpty(data.maps)) {
//                var index = (parseInt(data.maps[0].type) - 1);
//                index = index >= 0 ? index : 0;
//                var $a = $('<a>');
//                $a.text(badgeLevelName[index]);
//                $('#userBadge').find(".rankingbage_name").append($a)
//                $('#userBadge').find(".rankingbage_name").attr('title', badgeLevelName[index]);
//                $('#userBadge').on('click', function () {
//                    showBadge((index + 1), $('.course_name').text());
//                });
//            } else {
//                var $a = $('<a>');
//                $a.text(badgeLevelName[0]);
//                $('#userBadge').find(".rankingbage_name").append($a);
//                $('#userBadge').find(".rankingbage_name").attr('title', badgeLevelName[0]);
//                $('#userBadge').on('click', function () {
//                    showBadge(1, $('.course_name').text());
//                });
//            }
//        },
//        error: function () {
//
//        }
//    });
}

function getTopNo() {
//    $.post("/onlineSchool/json/notice/findRankInClassIdAndUserId?v=" + Math.random(), {
//    	"recruitId" : $("#rid").val() ,
//        "classId": $('#classId').val(),
//        "userId": $('#userId').val()
//    }, function (data) {
//        var number = parseInt(data.rank) ;
//        compareToLast(number);
//        $("#topNo").html(number);
//    });
}

//排名比较
function compareToLast(number) {
    if (isEmpty(number))return;
    var rankKey = 'rank_' + $('#userId').val() + '_' + $('#rid').val();
    var tip = zLocale.current_rank+'：' + number + "，";
    if (typeof ($.cookie(rankKey)) == "undefined") {
        tip += zLocale.progress;
        $("#arrow").removeClass().addClass("rise_arrow");
    } else {
        var lastRank = $.cookie(rankKey);
        if (number > parseInt(lastRank)) {
            $("#arrow").removeClass().addClass("down_arrow");
            tip += zLocale.backward;
        } else {
            $("#arrow").removeClass().addClass("rise_arrow");
            tip += zLocale.progress;
        }
    }
    $('.rankingbadge_l').attr('title', tip);

    $.cookie(rankKey, number, {expires: 1, path: '/'});

}

function showBadge(type, name) {
//    $.tmDialog.iframe({
//    	title:zLocale.tip,
//        showBtn: false,
//        pos: "absolute",
//        url: jsonPath + "/badge/badge?type=" + encodeURI(encodeURI(type)) + "&name=" + encodeURI(encodeURI(name)),
//        top: 20,
//        offsetTop: -10,
//        width: 800,
//        height: 450,
//        callback: function ($dialog, $iframe, $parent, opts) {
//            if ($dialog && $iframe && $parent) {
//
//            }
//        }
//    });
//    $(".popboxes_main").css("padding", "0px");
//    $(".box_popboxes").css({"float": "none", "display": "block"});
}

function getLearnBroswerTipKey() {
    return "online_learn_broswer_tip_" + $('#userId').val();
}

/**
 * 更换浏览器的提示
 * by 稽鹏
 */
function showExploreTip() {
    var _value = $.cookie(getLearnBroswerTipKey());
    if (isEmpty(_value)) {
        $(".exploreTip").slideDown("slow");
    }

    deleteExploreTip();
}

/** 删除浏览器的提示信息 */
function deleteExploreTip() {
    $(".hint_delete").one("click", function () {
        $(".exploreTip").slideUp("slow", function () {
            reSizePlayer(getPlayerSize().mW, getPlayerSize().mh);
        });
        $.cookie(getLearnBroswerTipKey(), 1, {expires: 7, path: '/'});

    });
}

//二维码
function videoQrcode(){ 
	var userId = $("#userId").val();
	var courseId = $("#courseId").val();
	var recruitId = $("#rid").val();
	var recruitType = $("#recruitType").val();
	var currentStudyTime;
	 try {
		 var millisecond = ablePlayerX("mediaplayer").getPosition() * 1000 - (1000 * 3600 * 8);
		 var date = new Date();
		 date.setTime(millisecond);
		 currentStudyTime = date.toLocaleTimeString();
		
		 if (currentStudyTime == 'Invalid Date') {
			 currentStudyTime = "00:00:00";
		 }
		
		 // 苹果电脑下noteTime展示错误，下为解决方法//
		 if (currentStudyTime.length != 8) {
		     var hour = date.getHours().toString();
		     var minute = date.getMinutes().toString();
		     var seconds = date.getSeconds().toString();
		
		     if (hour.length == 1) {
		         hour = "0" + hour;
		     }
		
		     if (minute.length == 1) {
		         minute = "0" + minute;
		     }
		
		     if (seconds.length == 1) {
		         seconds = "0" + seconds;
		     }

		     currentStudyTime = hour + ":" + minute + ":" + seconds;
		     }
	 } catch (e) {
	 } finally {
	 }
	var dt = "{u:"+userId+",c:"+courseId+",r:"+recruitId+",v:"+vId+",p:'"+currentStudyTime+"'}";
	dt = "video="+dt;
	$('#video_qrcode').children().remove();
	var w = 140;
	var h = 140;
	if(window.navigator.userAgent.indexOf("Chrome")!=-1){
		$("#video_qrcode").parent().removeClass("browser_w_h");
		w = 120;
		h = 120;
	}
	if(window.navigator.userAgent.indexOf("Safari")!=-1) {
		$("#video_qrcode").parent().removeClass("browser_w_h");
		w = 120;
		h = 120;   
	} 
	$('#video_qrcode').qrcode({render:"table",text:dt,width:w,height:h});
//	$('#video_qrcode').qrcode({text:dt,width:140,height:140});
	
}

function hideQrcode(){
//	ablePlayerX("mediaplayer").pause();//播放视频
	$("#codehint_box").hide();
}
function showQrcode(){
	ablePlayerX("mediaplayer").pause(true);//停止视频
	videoQrcode();
	$("#codehint_box").show();
}

// 考核标准弹出 by zhanglikun 2015/7/16
(function(){
	
	var recruitInfo = false ;	// 招生信息
	
	$(function(){
		
		// 弹出考核标准弹出层
		$("#j-assess-criteria_btn").click(function(){
			
			//$("#j-assess-criteria_popup").show() ;
			if (z_locale==1) {
				$("#j-assess-criteria_popup").animate({top:20,opacity:'show',width:840,height:430,right:-156},10);
			} else {
				$("#j-assess-criteria_popup").animate({top:20,opacity:'show',width:840,height:430,right:-310},10);
			}
			
			if ($("#showScoreAssessHtml").val() == "1") {
				// 第一次打开时加载招生信息和考核标准信息
				if(!recruitInfo) {
					ajaxGetRecruit() ;
					ajaxGetAssessInfo() ;
				}
			}
		}) ;
		// 关闭弹出层
		$(".j-popup-close").click(function(){
			//$("#j-assess-criteria_popup").hide() ;
			$("#j-assess-criteria_popup").animate({top:10,opacity: 'hide',width:0,height:0,right:-10},500);
		}) ;
	
		// 针对每个招生建一个cookie，以保证每个招生都会弹，这样好么？先这样吧！
		var cookie_name = 'assess_criteria_toggle_' + rid ;
		
		// 考核标准按钮显示时，才判断是否需要自动弹出
		if($("#j-assess-criteria_btn").is(":visible")) {
			// 从Cookie里获取考核阅读标记
			var act = $.cookie(cookie_name);
			// 如果标记不存在，或者是off，弹出考核标准，并将状态置为on
			if(!act || act == 'off') {
				$("#j-assess-criteria_btn").click() ;	// 触发弹出动作
				act = 'on' ;
				$.cookie(cookie_name ,act ,{expires: 30});   
			}
		}
		
	}) ;

	/**
	 * 获取考核信息
	 */
	function ajaxGetAssessInfo() {
		// courseId 上面有声明
		$.get(ctx + "/json/learning/findScoreAssessRule" ,{"courseId" : courseId ,"rid" : rid} ,function(data){
			var scoreAssessRule = data.scoreAssessRule ;
			var zhangRatio = data.zhangRatio;
			if(scoreAssessRule) {
				// 填充考核标准数据
				fillScoreRule(scoreAssessRule ,data.meetTotal,data.jsonExtend,zhangRatio) ;
			}
		}) ;
	}
	
	function dateTimeToDate(dateTimeStr){
		if(dateTimeStr == null) return "";
		var vPos = dateTimeStr.indexOf(" ");
		if(vPos == -1){
			vPos = dateTimeStr.indexOf("T");
		}
		if(vPos == -1) return dateTimeStr;
		return dateTimeStr.substr(0,vPos);
	}
	
	/**
	 * 填充考核标准 XXX
	 */
	function fillScoreRule(rule ,meetTotal,jsonExtend,zhangRatio) {
		var $popup = $("#j-assess-criteria_popup") ;
		if(rule.meetCourseScoreShare == "") rule.meetCourseScoreShare = "0";
		// 占比
		$popup.find(".j-rate-online").text(rule.onlineScoreShare||0) ;
		$popup.find(".j-rate-meet").text(rule.meetCourseScoreShare||0) ;
		$popup.find(".j-rate-final").text(rule.finalExamScoreShare||0) ;
		$popup.find(".j-rate-bbs").text(rule.bbsScore||0) ;
		$popup.find(".zhangRideo").text("章测试成绩："+zhangRatio+"分");
		$popup.find(".proRideo").text("学习进度成绩："+(rule.onlineScoreShare-zhangRatio)+"分");
		
		
		$("#_id_j-rate-online").text(rule.onlineScoreShare||0) ;
		$("#_id_j-rate-meet").text(rule.meetCourseScoreShare||0) ;
		$("#_id_j-rate-final").text(rule.finalExamScoreShare||0) ;
		$("#_id_j-rate-bbs").text(rule.bbsScore||0) ;
		
		// 成绩
		$popup.find(".j-score-online").text(rule.courseScoreShare||0) ;
		$popup.find(".j-score-pbl").text(rule.PBLScoreShare||0) ;
		$popup.find(".j-count-meet").text(meetTotal||0) ;
		// BBS成绩
		$popup.find(".j-bbs-fatie").text(rule.postScore||0) ;
		$popup.find(".j-bbs-huitie").text(rule.returnPostScore||0) ;
		$popup.find(".j-bbs-count-fatie").text(rule.postCount||0) ;
		$popup.find(".j-bbs-count-huitie").text(rule.returnPostCount||0) ;
		$popup.find(".j-bbs-count-teacher").text(rule.teacherGardScore||0) ;
		$popup.find(".postNum").text(rule.postNum||0) ;
		$popup.find(".returnPostNum").text(rule.returnPostNum||0) ;
		// 不是加分项
		if(rule.isAddScore == 0) {
			//$popup.find(".j-jiafenxiang-tips").hide() ;
		}
		
		//JIANGJH 2015/9/15
		if(rule.PBLScoreShare == "" || rule.PBLScoreShare == 0){
			$('#_id_pbl_scout').hide();
			$('#_id_index_1').text("1");
			$('#_id_index_2').text("2");
			$('#_id_index_3').text("3");
		}
		
		var chapterExams = jsonExtend.chapter;
		var vLateStr = "";
		var vLateStr2 = "";
		//显示允许迟交、百分等信息
		var vAllowCount = 0;
		var vNotAllowCount = 0;
		for(var vi = 0; vi < chapterExams.length; vi++){
			var vChapter = chapterExams[vi];
			if(vChapter.exam_late_setting == "1" || vChapter.exam_late_setting == "2"){
				if(vLateStr != "") vLateStr += "、";
				vLateStr += vChapter.chapnumber;				
				if(vLateStr2 == "" && vChapter.exam_late_score > 0){					
					vLateStr2 = zLocale.minus+vChapter.exam_late_score+zLocale.score;
				}
				vAllowCount++;
			}else{
				vNotAllowCount++;
			}			
		}
		if(vNotAllowCount == chapterExams.length){
			vLateStr = zLocale.all_chapter_can_not_up_later;
		}else{
			if(vAllowCount == chapterExams.length){
				if(vLateStr2 != "") vLateStr2 = ","+vLateStr2;
				vLateStr = zLocale.all_chapter_allow_up_later+ vLateStr2+"";
			}else{
				//if(vLateStr != "")
				{
					if(vLateStr2 != "") vLateStr2 = ","+vLateStr2;
					vLateStr="";
					if (z_locale==1) {
						vLateStr = "第"+vLateStr +"章"+zLocale.allow_later+ vLateStr2 + ","+zLocale.other_chapter_can_not_later;
					} else {
						vLateStr = "CHAPTER "+vLateStr +zLocale.allow_later+ vLateStr2 + ","+zLocale.other_chapter_can_not_later;
					}
					
				}
			}					
		}
		$('#_id_late_submit').text(vLateStr);
		
		//期末考试模式
		if(rule.finalExamType == -1){
			$('#_id_qimo_exam_type').text(zLocale.extra_exam);
		}else{
			$('#_id_qimo_exam_type').text(zLocale.online_exam);
		}		
		
		//期末时间
		var qimoExamTime = "";
		if(typeof(jsonExtend.exam) != "undefined" && jsonExtend.exam != null && jsonExtend.exam.exam_starttime != "" && jsonExtend.exam.exam_endtime != ""){
			qimoExamTime = dateTimeToDate(jsonExtend.exam.exam_starttime)+"-"+dateTimeToDate(jsonExtend.exam.exam_endtime);	
		}else{
			qimoExamTime = zLocale.notice_next_time			
		}
		$('#j-course-exam-time').text(qimoExamTime);
		$('#_id_qimo_exam_time').text(qimoExamTime);
		
		//设置见面课信息
		var vMCStr = "";
		var mcList = jsonExtend.mclist;
		if(jsonExtend.mclistTotal < 1) jsonExtend.mclistTotal = 1;
		for(var i=0; i<mcList.length; i++){//考情分*见面课成绩占比/见面课程总分
			//var vMCOne = "第"+(i+1)+"次: 考勤"+(mcList[i].checkScore*rule.meetCourseScoreShare)/jsonExtend.mclistTotal+"分,现场"+(mcList[i].siteScore*rule.meetCourseScoreShare)/jsonExtend.mclistTotal+"分";
			var vMCOne="";
			if (z_locale==1) {//中文
				vMCOne = "第"+(i+1)+"次:"
			}else{
				vMCOne = "NO."+(i+1);
			}
			 vMCOne+=zLocale.kaoqing+mcList[i].checkScore+zLocale.score+","+zLocale.xianchang+mcList[i].siteScore+zLocale.score;
			if(vMCStr != "") vMCStr += ",";
			vMCStr += vMCOne;
		}
		$('#_id_mclist_scout_detail').text(vMCStr);
		
		//考试内容
		if(jsonExtend.examContent==null) jsonExtend.examContent = zLocale.not_sure;
		$('#_id_qimo_exam_content').text(jsonExtend.examContent);
		
		//论坛设置
		$('#_id_luntan_scout').text(rule.bbsScore||0);
		if(rule.bbsScore == "" || parseInt(rule.bbsScore) == 0){
			$('#TabTitlediv_4').hide();
			$('#_idspan_bbs_extend_color').hide();
		}
		//计算论坛是否作为附加分
		if(parseInt(rule.onlineScoreShare) + parseInt(rule.meetCourseScoreShare) + parseInt(rule.finalExamScoreShare) == 100 && parseInt(rule.bbsScore) > 0){  //论坛作为附加分了
			$('#_id_bbs_extend1').hide();
			$('#_id_bbs_extend2').show();
			$('#_id_bbs_header_append').show();
			$('.additional_ico').show();
			$('#_idspan_bbs_extend_color').attr("style","color: #FF9D00;");
		}
				
	}
	
	/**
	 * 异步获取招生信息
	 */
	function ajaxGetRecruit () {
		// rid 上面有声明
		$.get(ctx + "/json/course/findRecruit" ,{"rid" : rid} ,function(data){
			/*if(data.recruitDto) {
				recruitInfo = data.recruitDto ;
				// 填充课程结束时间				
				if(recruitInfo.courseEndTime && recruitInfo.courseStartTime) {
					$(".j-course-endtime").text(dateTimeToDate(recruitInfo.courseStartTime)+"-"+dateTimeToDate(recruitInfo.courseEndTime)) ;
				}else{
					$(".j-course-endtime").text("");
				}
			}*/
			// 填充课程结束时间		
			if(data.jsonExtend.recruit_starttime != ""){
				$(".j-course-endtime").text(dateTimeToDate(data.jsonExtend.recruit_starttime)+"-"+dateTimeToDate(data.jsonExtend.recruit_endtime)) ;	
			}
					//补考设置
			if(data.jsonExtend.recruit_makeup == 0){  //补考需要老师同意
				$('#_id_exam_allow_makeup').text(zLocale.bukao_need_teach_agree);				
			}
			if(data.jsonExtend.recruit_makeup == 1){  //不允许补考
				$('#_id_exam_allow_makeup').text(zLocale.can_not_bukao);
			}
			if(data.jsonExtend.recruit_makeup == 2){  //允许补考
				$('#_id_exam_allow_makeup').text(zLocale.allow_bukao_last_score);
			}
			//加载期末考试时间
			if(data.examStart!=null && data.examEnd!=null ){
				$("#lastExamDate").text("考试时间为："+data.examStart+"-"+data.examEnd );
			}
			//加课程学习时间
			if(data.courseStart!=null){
				$("#courseDate").text("本课程的学习时间为："+data.courseStart+"-"+data.courseEnd +"，超过此时间：学习不记进度、作业停止提交、见面课回放不记签到、论坛停止计分。");
				$("#remindMessage").text("特别提醒：总成绩不及格将有一次补考机会，若补考成绩>=60分，则最终成绩=60分；若补考成绩<60分，则与第一次成绩比较，取较高分为最终成绩");
			}	
		}) ;
	}
	
	
	
})() ;

/**
 * 获取浏览器信息(测试发现可能$取不到，所以手动传入)
 * @param jquery
 * @returns {String}
 */
function browserMsg(jquery) {
	try {
		var $ = jquery || $ ;
		var btype = '' ;	// 浏览器类型
		if('chrome' in $.browser) btype = 'chrome' ; 
		else if('msie' in $.browser) btype = 'msie' ; 
		else if('mozilla' in $.browser) btype = 'mozilla' ; 
		else if('opera' in $.browser) btype = 'opera' ; 
		else if('webkit' in $.browser) btype = 'webkit' ;
		else btype = '未知' ;
    	return "浏览器内核[" + btype + "、版本：" + $.browser.version + "]" ;
	} catch(e) {
		if(console && console.log) console.log(e) ;
		return "获取浏览器信息失败" ;
	}
}


/**
 * 获得课程学术总策划
 *
 * @date 2017/4/21 11:18
 * @param
 * @return
 */
function getCourseSpeakerList() {
    var courseId = $("#courseId").val();
    $.ajax({
        type: 'post',
        url: basePath + "/json/learning/findCourseSpeakerListByJs",
        data: {"courseId": courseId},
        success: function (data) {
            $("#courseSpeaker").attr("title", data.courseSpeakerStr);
            var courseSpeakers = data.courseSpeakers;
            for (var i = 0; i < courseSpeakers.length; i++) {
                var $courseSpeakers = $("#courseSpeakers");
                $courseSpeakers.text($courseSpeakers.text() + courseSpeakers[i] + " ");
            }
        }
    });
}

function findNoteIdAndIsShareStatus() {
    $.ajax({
        type: 'post',
        url: basePath + "/json/learning/findNoteIdAndIsShareStatus",
        data: {"courseId": courseId},
        success: function (data) {
            if (data.isshare == 1) {
                $("#noteShareState").html("<span class='shareico_green' title='"+zLocale.note_shared+"'></span>");
            } else {
                $("#noteShareState").html("<span class='shareico_gray' title='"+zLocale.share_your_notes+"'></span>");
            }
        }
    });
}
//BY TGSAN