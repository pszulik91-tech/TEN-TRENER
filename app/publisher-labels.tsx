import {useEffect} from 'react';
import {applyPublisherLabels} from '../lib/publisher-labels.mjs';
export function PublisherLabels(){useEffect(()=>{const root=document.getElementById('root');if(!root)return;applyPublisherLabels(root);const observer=new MutationObserver(()=>applyPublisherLabels(root));observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title']});return()=>observer.disconnect();},[]);return null;}
